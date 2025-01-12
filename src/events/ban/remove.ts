import {
  Events,
  GuildBan,
} from 'discord.js'

export default {
  id: Events.GuildBanRemove,

  async react(bot: BotInterface, ban: GuildBan): Promise<void> {

  }
}
