import { Guild, GuildMember } from 'discord.js'
import GuildInstance from './guild.js'
import bot from '../index.js'
import { QuerySnapshot } from 'firebase-admin/firestore'
import GuildMemberInstance from './guildMember.js'

// TODO: Make this shit less circular than my sexuality
const Leaderboard = class extends GuildInstance implements LeaderboardInterface {
  constructor(guild: Guild) {
    super(guild)
  }
  private async normalizeSnapshot(snapshot: QuerySnapshot, relative: boolean = false): Promise<Map<number, DatabaseGuildMemberInstance>> {
    let lbSnapshot = new Map<number, DatabaseGuildMemberInstance>()
    // Get all class instances of members in the snapshot
    for (let [i, userDoc] of snapshot.docs.entries()) {
      let data = userDoc.data() as DiscordGuildMemberData
      let cached: DatabaseGuildMemberInstance = this.cache.get(data.id)

      // Append member to the cache if they dont already exist
      if (!cached) {
        cached = new GuildMemberInstance(await bot.fetchGuildMember(data.id, this.guild))
        cached.init(userDoc)
        this.cache.set(data.id, cached)
      }
      console.log(snapshot.size)
      lbSnapshot.set(i + (relative ? snapshot.size : 0), cached)
    }

    return lbSnapshot
  }
  // Get the top 10 members
  public async top(): Promise<Map<number, DatabaseGuildMemberInstance>> {
    let snapshot = await this.queryMembers({
      field: 'loot_league.score',
      orderBy: 'desc',
      limit: 10,
    })
    return await this.normalizeSnapshot(snapshot)
  }
  // Get the position of a member
  public async getPosition(member: string | GuildMember): Promise<Map<number, DatabaseGuildMemberInstance>> {
    let instance = await this.fetchMember(member)
    let snapshot = await this.queryMembers({
      field: 'loot_league.score',
      orderBy: 'desc',
      startAfter: instance.score,
      limit: 4,
    })
    return await this.normalizeSnapshot(snapshot, true)
  }
}

export default Leaderboard
