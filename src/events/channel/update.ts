import {
  DMChannel,
  Events,
  GuildChannel,
} from 'discord.js'

export default {
  id: Events.ChannelUpdate,

  async react(bot: BotInterface, oldChannel: DMChannel | GuildChannel, newChannel: DMChannel | GuildChannel): Promise<void> {

  }
}
