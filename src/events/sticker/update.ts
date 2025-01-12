import {
  Events,
  Sticker,
} from 'discord.js'

export default {
  id: Events.GuildStickerUpdate,

  async react(bot: BotInterface, oldSticker: Sticker, newSticker: Sticker): Promise<void> {

  }
}
