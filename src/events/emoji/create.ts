import {
  Events,
  GuildEmoji,
} from 'discord.js'

export default {
  id: Events.GuildEmojiCreate,

  async react(bot: BotInterface, emoji: GuildEmoji): Promise<void> {

  }
}
