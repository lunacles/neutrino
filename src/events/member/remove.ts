import {
  Events,
  GuildMember,
  PartialGuildMember,
  //Role,
} from 'discord.js'
//import GuildCollection from '../../user-manager/guildcollection.js'

export default {
  id: Events.GuildMemberRemove,

  async react(bot: BotInterface, member: GuildMember | PartialGuildMember): Promise<void> {
    /*
    // if the user is a bot, ignore them
    if (member.user.bot) return

    let guild: GuildCollectionInterface = await GuildCollection.fetch(member.guild.id)
    let user: UserDataInterface = await guild.fetchMember(member.id)

    await user.database.write(new Map(member.roles.cache.map((role: Role) => [role.id, {
      name: role.name,
      color: `#${role.color.toString(16)}`,
      icon: role.icon,
    } satisfies GuildRole])))
*/
    /*
    let attachments: Collection<Snowflake, Attachment> = message.attachments
    if (message.guild.id === config.testServerId && attachments.size > 0) {
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
