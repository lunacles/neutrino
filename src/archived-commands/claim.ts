import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js'
import CommandInterface from '../commands/interface.js'
import InteractionObserver from '../commands/interactionobserver.js'
import global from '../global.js'
import {
  Database
} from '../firebase/database.js'
import * as util from '../utilities/util.js'
import Icon from '../utilities/icon.js'

const Claim: CommandInterface = {
  name: 'claim',
  description: `Claim some points! ${util.formatSeconds(global.cooldown.claim)} cooldown.`,
  data: new SlashCommandBuilder(),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply()
    const observer = new InteractionObserver(interaction)
    if (interaction.guild.id !== global.arrasDiscordId) return await observer.abort(3)

    let user = await Database.getUser(interaction.user.id, interaction.guild)
    let data = user.data.scoregame.data
    let cooldown: number = Math.floor((Date.now() - data.cooldown.claim) / 1e3)
    if (cooldown < global.cooldown.claim) {
      interaction.editReply(`This command is on cooldown for **${util.formatSeconds(global.cooldown.claim - cooldown, true)}!**`)
      return
    } else {
      // Get a random score between 1 and 100
      let claimedScore: number = Math.floor(Math.random() * (200 - 15) + 15)
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
      await user.misc.scoreGame.setScore(interaction.guild, data.score + claimedScore)
      await user.misc.scoreGame.setCooldown(interaction.guild, 'claim', Date.now())

      const embed = new EmbedBuilder()
        .setColor(user.author.hexAccentColor)
        .setAuthor({
          name: `${user.author.username}`,
          iconURL: user.author.avatarURL(),
        })
        .setThumbnail(`attachment://${icon}`)
        .setDescription(`# You have claimed **${claimedScore.toLocaleString()} points!**`)

      interaction.editReply({
        embeds: [embed],
        files: [{
          attachment: `./src/utilities/assets/${icon}`,
          name: icon,
        }]
      })
    }
  },
  test(): boolean {
    return true
  },
}

export default Claim
