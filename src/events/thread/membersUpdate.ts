import {
  Collection,
  Events,
  Snowflake,
  ThreadMember,
} from 'discord.js'

export default {
  id: Events.ThreadMemberUpdate,
  async react(bot: BotInterface, oldMembers: Collection<Snowflake, ThreadMember>, mewMembers: Collection<Snowflake, ThreadMember>): Promise<void> {

  }
}
