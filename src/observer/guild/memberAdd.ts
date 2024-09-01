import {
  Events,
  GuildMember,
  //Role,
} from 'discord.js'
//import GuildCollection from '../../user-manager/guildcollection.js'

const MemberAdd: Observer = {
  id: Events.GuildMemberAdd,
  active: false,
  async react(bot: any, member: GuildMember): Promise<void> {
    /*
    // if the user is a bot, ignore them
    if (member.user.bot) return

    let guild: GuildCollectionInterface = await GuildCollection.fetch(member.guild.id)
    let user: UserDataInterface = await guild.fetchMember(member.id)

    if (user.data.roles && Object.values(user.data.roles).length > 0) {
      let persistingRoles: Array<string> = Object.keys(user.data.roles).filter((id: string) => guild.data.rolePersistance.has(id))
      for (let persistentRole of persistingRoles)
        member.roles.add(member.guild.roles.cache.find((role: Role) => role.id === persistentRole))
    }
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

export default MemberAdd
