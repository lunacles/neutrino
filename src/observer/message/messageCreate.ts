import {
  Client,
  Message,
  Events,
} from 'discord.js'
import Observer from '../interface.js'
import { GuildCollection, GuildCollectionInterface } from '../../user-manager/guildcollection.js'

const MessageCreate: Observer = {
  eventID: Events.MessageCreate,
  active: false,
  async react(bot: Client, message: Message): Promise<void> {
    // if the user is a bot, ignore them
    if (message.author.bot) return

    //if (message.guild.id === global.testServerId) {
      let guild: GuildCollectionInterface = await GuildCollection.fetch(message.guild.id)
      let userData = await guild.fetchMember(message.author.id)
      await userData.xpData.passiveXP()
    //}
  }
}

export default MessageCreate
