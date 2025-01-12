import {
  Events,
  GuildChannel,
} from 'discord.js'

export default {
  id: Events.ChannelCreate,

  async react(bot: BotInterface, channel: GuildChannel): Promise<void> {

  }
}
