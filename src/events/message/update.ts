import {
  Message,
  Events,
  PartialMessage,
} from 'discord.js'

export default {
  id: Events.MessageUpdate,

  async react(bot: BotInterface, oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage): Promise<void> {
    // if the user is a bot, ignore them
    if (oldMessage.author?.bot || newMessage.author?.bot) return

  }
}
