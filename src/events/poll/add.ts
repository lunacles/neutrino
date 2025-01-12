import {
  Events,
  GuildBan,
} from 'discord.js'

export default {
  id: Events.MessagePollVoteAdd,

  async react(bot: BotInterface, ban: GuildBan): Promise<void> {

  }
}
