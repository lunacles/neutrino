import {
  Client,
  Message,
  Events,
  Guild,
} from 'discord.js'
import Observer from '../interface.js'
import {
  Database,
} from '../../firebase/database.js'

const MessageCreate: Observer = {
  eventID: Events.MessageCreate,
  active: false,
  async react(bot: Client, message: Message): Promise<void> {
    // if the user is a bot, ignore them
    if (message.author.bot) return
    let guild: Guild = await message.guild.fetch()
    let userData = await Database.getUser(message.author.id, guild)

    await userData.guild?.log.message(message)
  }
}

export default MessageCreate
