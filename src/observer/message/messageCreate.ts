import {
  Message,
  Events,
} from 'discord.js'
import GuildCollection from '../../user-manager/guildcollection.js'
import fetch from 'node-fetch'
import Log from '../../utilities/log.js'
import global from '../../global.js'
import {
  Observer
} from '../../types.js'

const MessageCreate: Observer = {
  eventID: Events.MessageCreate,
  active: false,
  async react(bot: any, message: Message): Promise<void> {
    // if the user is a bot, ignore them
    if (message.author.bot) return

    /*
    let attachments: Collection<Snowflake, Attachment> = message.attachments
    if (message.guild.id === global.testServerId && attachments.size > 0) {
      let map: Array<Attachment> = attachments.map((message: Attachment) => message)

      for (let attachment of map) {
        if (['image/png', 'image/jpeg', 'image/gif', 'image/jpg'].includes(attachment.contentType)) {
          let response = await fetch(attachment.url)
          let buffer: Buffer = await response.buffer()
          let similarity: number | Array<number> = await bot.model.compare(buffer)
          if (Array.isArray(similarity)) {
            Log.info(`Unable to find matches. ${similarity}`)
          } else {
            Log.info(`Found a match! ${similarity}`)
            await message.delete()
          }
        }
      }


      // let guild: GuildCollectionInterface = await GuildCollection.fetch(message.guild.id)
      // let userData = await guild.fetchMember(message.author.id)
      // await userData.xpData.passiveXP()

    }*/
  }
}

export default MessageCreate
