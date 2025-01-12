import {
  Events,
  GuildEmoji,
} from 'discord.js'

export default {
  id: Events.GuildEmojiDelete,

  async react(bot: BotInterface, emoji: GuildEmoji): Promise<void> {

  }
}
