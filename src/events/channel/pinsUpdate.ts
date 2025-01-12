import {
  DMChannel,
  Events,
  NewsChannel,
  PartialDMChannel,
  TextChannel,
} from 'discord.js'

export default {
  id: Events.ChannelPinsUpdate,

  async react(bot: BotInterface, channel: TextChannel | NewsChannel | DMChannel | PartialDMChannel, date: Date): Promise<void> {

  }
}
