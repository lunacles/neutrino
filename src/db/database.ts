import { Collection, Guild, User } from 'discord.js'
import bot from '../index.js'
import UserInstance from './user.js'
import GuildInstance from './guild.js'
import { initApp, FirebaseDatabase } from './firebase/database.js'
import Leaderboard from './leaderboard.js'
import Log from '../utilities/log.js'

FirebaseDatabase.database = await initApp()

// limit the snapshot amount to 100 entries
// NOTE: maybe make this scale with the amount of temp bans pending?
const snapshotLimit: number = 100
// 15 minutes should be sufficient?
const emptySnapshotRefreshRate: number = 60 ** 2 * 15 * 1e3

const Database: DatabaseInterface = {
  version: 1,
  discord: {
    users: {
      // Keep a local cache to reduce dependency on the external database
      cache: new Collection<string, DatabaseUserInstance>(),
      async fetch(user: string | User): Promise<DatabaseUserInstance> {
        // We can provide a User instance or a sting, either works
        if (typeof user === 'string')
          user = await bot.fetchUser(user)

        // Check if we're in the cache or not
        let cached: DatabaseUserInstance = this.cache.get(user.id)
        if (!cached) {
          // If not, set us and fetch our data
          cached = this.cache.set(user.id, new UserInstance(user)).get(user.id)
          await cached.fetch()
        }

        return cached
      },
    },
    guilds: {
      // Keep a local cache to reduce dependency on the external database
      cache: new Collection<string, DatabaseGuildInstance>(),
      async fetch(guild: string | Guild): Promise<DatabaseGuildInstance> {
        // We can provide a Guild instance or a sting, either works
        if (typeof guild === 'string')
          guild = await bot.fetchGuild(guild)

        let cached: DatabaseGuildInstance = this.cache.get(guild.id)

        // Check if we're in the cache or not
        if (!cached) {
          // If not, set us and fetch our data
          cached = this.cache.
          set(guild.id, new GuildInstance(guild)).get(guild.id)
          await cached.fetch()
          // TODO: Bandaid fix for a dumb setup. Fix later
          cached.leaderboard = new Leaderboard(guild)
        }

        return cached
      },
    },
    bans: {
      activeManager: new FirebaseDatabase('bans').cd('~/'),
      expiredManager: new FirebaseDatabase('expired_bans').cd('~/'),
      // Keep a local cache to reduce dependency on the external database
      cache: new Collection<string, NodeJS.Timeout>(),
      // Append a ban to the database
      async append(ban: BanInfo): Promise<void> {
        // If we expire before the last instance, cache it
        if (this.cache.size < 100 && ban.expires_at < parseInt(this.cache.lastKey()))
          await this.addToCache(ban)

        // Even if we're able to cache it right now,
        // we need to append it anyway incase we shit the bed
        await this.activeManager.touch(ban.neutrino_id, ban)
      },
      // Unban and archive expired bans
      async archive(ban: BanInfo): Promise<void> {
        Log.db(`Removing and archiving a ban for user with id "${ban.user_id}"`)
        // Unban them
        let guildInstance = await Database.discord.guilds.fetch(ban.guild_id);
        await guildInstance.guild.bans.remove(ban.user_id, `Temporary ban with id "${ban.neutrino_id}" expired.`)

        // Archive the ban
        await this.expiredManager.touch(ban.neutrino_id, ban)
        await this.activeManager.rm(ban.neutrino_id)
      },
      // Add a ban to the cache
      async addToCache(data: BanInfo): Promise<void> {
        Log.db(`Adding a ban to the cache for user with id "${data.user_id}"`)

        this.cache.set(
          data.expires_at.toString(),
          // Set a timeout for when the ban is expected to expire
          setTimeout(async () => {
            await this.archive(data)
            this.cache.delete(data.expires_at.toString())

            // If the cache is now empty, collect the next set of bans from the db
            if (this.cache.size <= 0)
              await this.collect(data.expires_at)
          }, data.expires_at - Date.now())
        )
      },
      async collect(/* startAfter: number = 0 */): Promise<void> {
        Log.db('Collecting next 100 bans...')
        // Get a snapshot of the next 100 bans
        let snapshot: Snapshot = await this.activeManager.query({
          field: 'expires_at',
          orderBy: 'asc',
          limit: snapshotLimit,
          // wait this isn't necessary because of archiving?
          //startAfter,
        })

        // In the chance theres no bans pending, check again in a bit
        if (snapshot.size <= 0) {
          setTimeout(this.collect(/* startAfter */), emptySnapshotRefreshRate)
          return
        }

        for (let ban of snapshot.docs.values()) {
          let data = ban.data() as BanInfo

          // If it's already expired, archive it and continue
          if (Date.now() > data.expires_at) {
            await this.archive(data)
            continue
          }
          console.log(data.expires_at, Date.now())
          // Append it to the cache
          await this.addToCache(data)
        }

      },
    }
  },
}

export default Database
