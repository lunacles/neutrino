import FirebaseGuildInstance from './firebase/guild.js'
import { Collection, Guild, GuildMember } from 'discord.js'
import bot from '../index.js'
import Log from '../utilities/log.js'
import Database from './database.js'
import GuildMemberInstance from './guildMember.js'
import { Query } from 'firebase-admin/firestore'

  constructor(guild: Guild) {
    super(guild)
    this.guild = guild
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
  // Query for data
  public async queryMembers({
    field,
    orderBy = null,
    limit = null,
    startAt = null,
    startAfter = null,
    endAt = null,
    endBefore = null,
    comparator = null,
    operand = null,
  }: QueryInterface): Promise<Snapshot> {
    try {
      let query: Query = this.ref.collection(`users`)

      // I fucking hate this
      if (field && comparator && operand)
        query = query.where(field, comparator, operand)
      if (field && orderBy)
        query = query.orderBy(field, orderBy)
      if (limit)
        query = query.limit(limit)
      if (startAt)
        query = query.startAt(startAt)
      if (startAfter)
        query = query.startAfter(startAfter)
      if (endAt)
        query = query.endAt(endAt)
      if (endBefore)
        query = query.endBefore(endBefore)

      return await query.get()
    } catch (err) {
      Log.error(`Failed to query documents from path "${this.ref.path}"`, err)
    }
  }

}

export default GuildInstance
