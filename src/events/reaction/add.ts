import {
  Events,
  PartialMessageReaction,
  MessageReaction,
  PartialUser,
  User,
} from 'discord.js'

export default {
  id: Events.MessageReactionAdd,

  async react(bot: BotInterface, message: MessageReaction | PartialMessageReaction, user: User | PartialUser): Promise<void> {
    // if the user is a bot, ignore them
    if (user.bot) return

  }
}
