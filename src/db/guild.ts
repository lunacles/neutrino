import config from '../config.js'
import JSONGuildInstance from './json/guild.js'
import FirebaseGuildInstance from './firebase/guild.js'
import { Guild } from 'discord.js'

const Type = (config.databaseType === 'json' ? JSONGuildInstance : FirebaseGuildInstance) as {
  new (guild: Guild): ConfigInterface['databaseType'] extends 'json' ? JSONDBInstanceInterface : FirebaseInstanceInterface
}
const GuildInstance = class extends Type implements DatabaseGuildInstance {
  public leaderboard: BinaryHeapInterface<string>
  public data: DiscordGuildData
  public ran: RandomInterface
  public rolePersist: Set<string>
  public ignoredChannels: Set<string>
  public db_timestamp: number
  public neutrinoGuildId: string
  constructor(guild: Guild) {
    super(guild)
  }
  public async refreshLeaderboard(): Promise<void> {
    await this.updateField('leaderboard', this.leaderboard.heap)
  }
  public async addRolePersist(role: string): Promise<void> {
    await this.union('role_persist', [role])
    this.rolePersist.add(role)
  }
  public async removeRolePersist(role: string): Promise<void> {
    await this.remove('role_persist', [role])
    this.rolePersist.delete(role)
  }
  public async addIgnoredChannel(channel: string): Promise<void> {
    await this.union('ignored_channels', [channel])
    this.ignoredChannels.add(channel)
  }
  public async removeIgnoredChannel(channel: string): Promise<void> {
    await this.remove('ignored_channels', [channel])
    this.ignoredChannels.delete(channel)
  }
  public async fetchMember(member: string | GuildMember): Promise<DatabaseGuildMemberInstance> {

    // We can provide a GuildMember instance or a string, either works
    if (typeof member === 'string')
      member = await bot.fetchGuildMember(member, this.guild)

    // If we don't have them in the users collection, add them
    if (!Database.discord.users.cache.has(member.id))
      await Database.discord.users.fetch(member.id)

    let cached: DatabaseGuildMemberInstance = this.cache.get(member.id)

    // Check if we're in the cache or not
    if (!cached) {
      // If not, set us and fetch our data
      cached = this.cache.set(member.id, new GuildMemberInstance(member)).get(member.id)
      await cached.fetch()
    }

    return cached
  }
}

export default GuildInstance
