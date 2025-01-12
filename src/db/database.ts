import { Collection, Guild, User } from 'discord.js'
import bot from '../index.js'
import UserInstance from './user.js'
import GuildInstance from './guild.js'
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
          cached = this.cache.set(guild.id, new GuildInstance(guild)).get(guild.id)
          await cached.fetch()

          // Fetch all user docs for our leaderboard
          await Promise.all(cached.data.leaderboard.map(async (entry: string) => {
            await Database.discord.users.fetch(entry)
            cached.leaderboard.insert(entry)
          }))
        }

        return cached
      },
    },
  },
}
export default Database
