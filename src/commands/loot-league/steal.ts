import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandUserOption,
  EmbedBuilder,
} from 'discord.js'
import {
  CommandInterface,
  GuildCollectionInterface,
  UserDataInterface,
  LootLeagueInterface,
} from '../../types.js'
import GuildCollection from '../../user-manager/guildcollection.js'
import InteractionObserver from '../interactionobserver.js'
import global from '../../utilities/global.js'
import * as util from '../../utilities/util.js'
import Icon from '../../utilities/icon.js'

const Steal: CommandInterface = {
  name: 'steal',
  description: `Attempt to steal some points from anotehr player! ${util.formatSeconds(global.cooldown.steal)} cooldown.`,
  data: new SlashCommandBuilder()
  .addUserOption((option: SlashCommandUserOption ): SlashCommandUserOption => option
    .setName('user')
    .setDescription('The user to steal from.')
    .setRequired(true)
  ),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply()
    const targetUserOption = interaction.options.getUser('user', true)
    const observer = new InteractionObserver(interaction)

    if (interaction.guild.id !== global.testServerId) return await observer.abort(3)
    if (targetUserOption.id === interaction.user.id) return await observer.abort(4)

    let guild: GuildCollectionInterface = await GuildCollection.fetch(interaction.guildId)
    let userData: UserDataInterface = await guild.fetchMember(interaction.user.id)
    let targetData: UserDataInterface = await guild.fetchMember(targetUserOption.id)

    let userLootLeague: LootLeagueInterface = userData.lootLeague
    let targetLootLeague: LootLeagueInterface = targetData.lootLeague
    if (userLootLeague.shieldEnd > Date.now()) {
      interaction.editReply('You cannot steal from someone while you have a shield active!')
      return
    } else if (targetLootLeague.score < 250) {
      interaction.editReply('You cannot steal from someone with less than 250 points!')
      return
    } else if (userLootLeague.score < 250) {
      interaction.editReply('You cannot steal from someone if you have less than 250 points!')
      return
    } else if (targetLootLeague.shieldEnd > Date.now()) {
      interaction.editReply(`You cannot steal from someone who has a shield active!\nTheir shield will expire <t:${Math.floor(targetLootLeague.shieldEnd / 1e3)}:R>`)
      return
    }

    let cooldown: number = Math.floor((Date.now() - userLootLeague.cooldown.steal) / 1e3)
    if (cooldown < global.cooldown.steal) {
      interaction.editReply(`This command is on cooldown for **${util.formatSeconds(global.cooldown.steal - cooldown, true)}!**`)
      return
    } else {
      let succeed: boolean = Math.random() < 0.5
      let stolenScore: number = Math.floor(Math.max(targetLootLeague.score * 0.3 * Math.random(), targetLootLeague.score * 0.3 * 0.25))

      if (succeed) {
        await targetLootLeague.setScore(userLootLeague.score + stolenScore)
        await targetLootLeague.setScore(targetLootLeague.score - stolenScore)
        const embed = new EmbedBuilder()
          .setColor(userData.user.hexAccentColor)
          .setAuthor({
            name: `${userData.user.username}`,
            iconURL: userData.user.avatarURL(),
          })
          .setThumbnail(`attachment://${Icon.Robber}`)
          .setDescription(`# You successfully stole __${stolenScore.toLocaleString()}__ from <@${targetData.user.id}>!`)
          .addFields({
            name: 'Your New Points',
            value: userLootLeague.score.toLocaleString(),
            inline: true,
          }, {
            name: `${targetData.user.username}'s New Points`,
            value: targetLootLeague.score.toLocaleString(),
            inline: true,
          })

        interaction.editReply({
          embeds: [embed],
          files: [{
            attachment: `./src/utilities/assets/${Icon.Robber}`,
            name: Icon.Robber,
          }]
        })
      } else {
        await userLootLeague.setScore(Math.max(userLootLeague.score - stolenScore, 0))
        const embed = new EmbedBuilder()
          .setColor(userData.user.hexAccentColor)
          .setAuthor({
            name: `${userData.user.username}`,
            iconURL: userData.user.avatarURL(),
          })
          .setThumbnail(`attachment://${Icon.Amputation}`)
          .setDescription(`# You failed to steal from <@${targetData.user.id}> and lost __${stolenScore.toLocaleString()}__!`)
          .addFields({
            name: 'Your New Points',
            value: userLootLeague.score.toLocaleString(),
            inline: true,
          }, {
            name: `${targetData.user.username}'s New Points`,
            value: targetLootLeague.score.toLocaleString(),
            inline: true,
          })

        interaction.editReply({
          embeds: [embed],
          files: [{
            attachment: `./src/utilities/assets/${Icon.Amputation}`,
            name: Icon.Amputation,
          }]
        })
      }

      await userLootLeague.setCooldown('steal', Date.now())
    }
  },
  test(): boolean {
    return true
  },
}

export default Steal
