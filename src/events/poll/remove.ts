import {
  Events,
  GuildBan,
} from 'discord.js'

export default {
  id: Events.MessagePollVoteRemove,

  async react(bot: BotInterface, ban: GuildBan): Promise<void> {

  }
}
