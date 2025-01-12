import {
  Events,
  MessageReaction,
  PartialMessageReaction,
} from 'discord.js'

export default {
  id: Events.MessageReactionRemoveEmoji,

  async react(bot: BotInterface, reaction: MessageReaction | PartialMessageReaction): Promise<void> {

  }
}
