import {
  Message,
  Events,
  PartialMessage,
} from 'discord.js'

export default {
  id: Events.MessageDelete,

  async react(bot: BotInterface, message: Message | PartialMessage): Promise<void> {
    // if the user is a bot, ignore them
    if (message.author?.bot) return

  }
}
