import {
  Collection,
  Events,
  Snowflake,
  ThreadChannel,
} from 'discord.js'

export default {
  id: Events.ThreadListSync,
  async react(bot: BotInterface, threads: Collection<Snowflake, ThreadChannel>): Promise<void> {

  }
}
