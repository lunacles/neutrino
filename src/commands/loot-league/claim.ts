import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
} from 'discord.js'
import {
  CommandInterface,
  GuildCollectionInterface,
  UserDataInterface,
  LootLeagueInterface,
} from '../../types.js'
import InteractionObserver from '../interactionobserver.js'
import global from '../../global.js'
import * as util from '../../utilities/util.js'
import Icon from '../../utilities/icon.js'
import GuildCollection from '../../user-manager/guildcollection.js'

const Claim: CommandInterface = {
  name: 'claim',
  description: `Claim some points! ${util.formatSeconds(global.cooldown.claim)} cooldown.`,
  data: new SlashCommandBuilder(),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply()
    const observer = new InteractionObserver(interaction)
    //if (interaction.guild.id !== global.testServerId) return await observer.abort(3)
    if (interaction.channel.id !== global.commandChannels.lootLeague && !observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], interaction.channel))
      return await observer.abort(5)

    let guild: GuildCollectionInterface = await GuildCollection.fetch(interaction.guildId)
    let userData: UserDataInterface = await guild.fetchMember(interaction.user.id)
    let lootLeague: LootLeagueInterface = userData.lootLeague

    let cooldown: number = Math.floor((Date.now() - lootLeague.cooldown.claim) / 1e3)
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
      await lootLeague.setScore(lootLeague.score + claimedScore)
      await lootLeague.setCooldown('claim', Date.now())

      const embed = new EmbedBuilder()
        .setColor(userData.user.hexAccentColor)
        .setAuthor({
          name: `${userData.user.username}`,
          iconURL: userData.user.avatarURL(),
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
