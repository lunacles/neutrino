import { Collection, Guild, User } from 'discord.js'
import bot from '../index.js'
import UserInstance from './user.js'
import GuildInstance from './guild.js'

interface DatabaseInterface {
  readonly version: number
  discord: {
    users: {
      cache: Collection<string, DatabaseUserInstance>
      fetch(user: string | User): Promise<DatabaseUserInstance>
    },
    guilds: {
      cache: Collection<string, DatabaseGuildInstance>
      fetch(guild: string | Guild): Promise<DatabaseGuildInstance>
    },
  },
}

const Database: DatabaseInterface = {
  version: 1,
  discord: {
    users: {
      cache: new Collection<string, DatabaseUserInstance>(),
      async fetch(user: string | User): Promise<DatabaseUserInstance> {
        if (typeof user === 'string')
          user = await bot.fetchUser(user)

        let cached: DatabaseUserInstance = this.cache.get(user.id)
        if (!cached) {
          cached = this.cache.set(user.id, new UserInstance(user)).get(user.id)
          await cached.fetch()
        }

        return cached
      },
    },
    guilds: {
      cache: new Collection<string, DatabaseGuildInstance>(),
      async fetch(guild: string | Guild): Promise<DatabaseGuildInstance> {
        if (typeof guild === 'string')
          guild = await bot.fetchGuild(guild)

        let cached: DatabaseGuildInstance = this.cache.get(guild.id)

        if (!cached) {
          cached = this.cache.set(guild.id, new GuildInstance(guild)).get(guild.id)
          await cached.fetch()

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
