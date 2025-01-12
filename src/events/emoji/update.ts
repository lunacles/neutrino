import {
  Events,
  GuildEmoji,
} from 'discord.js'

export default {
  id: Events.GuildEmojiUpdate,

  async react(bot: BotInterface, oldEmoji: GuildEmoji, newEmoji: GuildEmoji): Promise<void> {

  }
}
