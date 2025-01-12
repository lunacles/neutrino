import {
  DMChannel,
  Events,
  GuildChannel,
} from 'discord.js'

export default {
  id: Events.ChannelDelete,

  async react(bot: BotInterface, channel: DMChannel | GuildChannel): Promise<void> {

  }
}
