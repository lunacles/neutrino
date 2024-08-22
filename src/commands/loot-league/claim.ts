import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
  User,
} from 'discord.js'
import InteractionObserver from '../interactionobserver.js'
import * as util from 'utilities/util.js'
import Icon from 'utilities/icon.js'
import Database from 'db/database.js'
import { Abort } from 'types/enum.d.js'
import global from 'global.js'

const Claim: CommandInterface = {
  name: 'claim',
  description: `Claim some points! ${util.formatSeconds(global.cooldown.claim)} cooldown.`,
  data: new SlashCommandBuilder(),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()
    const user: User = await util.fetchUser(interaction.user.id)

    //if (interaction.guild.id !== global.testServerId) return await observer.abort(Abort.CommandUnavailableInServer)
    if (interaction.channel.id !== global.commandChannels.lootLeague && !observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], interaction.channel))
      return await observer.abort(Abort.CommandRestrictedChannel)

    try {
      let userData: DatabaseInstanceInterface = await Database.discord.users.fetch(user)

      if (observer.isOnCooldown('claim')) {
        await interaction.editReply(`This command is on cooldown for **${util.formatSeconds(observer.getCooldown('claim'), true)}!**`)
        return
      } else {
        // Get a random score between 15 and 200
        let claimedScore: number = await userData.fromRange(15, 200, 'Integer')//Math.floor(Math.random() * (200 - 15) + 15)
        let icon: string
        if (claimedScore < 40) {
          icon = Icon.ReceiveMoney
        } else if (claimedScore < 80) {
          icon = Icon.Cash
        } else if (claimedScore < 120) {
          icon = Icon.Coins
        } else if (claimedScore < 160) {
          icon = Icon.GoldBar
        } else {
          icon = Icon.OpenTreasureChest
        }
        await userData.setScore(userData.score + claimedScore)
        observer.resetCooldown('claim')

        const embed = new EmbedBuilder()
          .setColor(user.accentColor)
          .setAuthor({
            name: `${user.username}`,
            iconURL: user.avatarURL(),
          })
          .setThumbnail(`attachment://${icon}`)
          .setDescription(`# You have claimed **${claimedScore.toLocaleString()} points!**`)

        await interaction.editReply({
          embeds: [embed],
          files: [{
            attachment: `./src/utilities/assets/${icon}`,
            name: icon,
          }]
        })
      }
    } catch (err) {
      await observer.panic(err, this.name)
    }
  },
  test(): boolean {
    return true
  },
}

export default Claim
