import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandUserOption,
  EmbedBuilder,
} from 'discord.js'
import CommandInterface from '../commands/interface.js'
import InteractionObserver from '../commands/interactionobserver.js'
import global from '../global.js'
import {
  Database
} from '../firebase/database.js'
import * as util from '../utilities/util.js'
import UserData from '../firebase/userdoc.js'
import Icon from '../utilities/icon.js'

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

    if (interaction.guild.id !== global.arrasDiscordId) return await observer.abort(3)
    if (targetUserOption.id === interaction.user.id) return await observer.abort(4)

    let user = Database.users.get(interaction.user.id) ?? await UserData.new(interaction.user.id, interaction.guild)
    let target = Database.users.get(targetUserOption.id) ?? await UserData.new(targetUserOption.id, interaction.guild)
    let userData = user.data.scoregame.data
    let targetData = target.data.scoregame.data

    if (userData.shieldEnd > Date.now()) {
      interaction.editReply('You cannot steal from someone while you have a shield active!')
      return
    } else if (targetData.score < 250) {
      interaction.editReply('You cannot steal from someone with less than 250 points!')
      return
    } else if (userData.score < 250) {
      interaction.editReply('You cannot steal from someone if you have less than 250 points!')
      return
    } else if (targetData.shieldEnd > Date.now()) {
      interaction.editReply(`You cannot steal from someone who has a shield active!\nTheir shield will expire <t:${Math.floor(targetData.shieldEnd / 1e3)}:R>`)
      return
    }

    let cooldown: number = Math.floor((Date.now() - userData.cooldown.steal) / 1e3)
    if (cooldown < global.cooldown.steal) {
      interaction.editReply(`This command is on cooldown for **${util.formatSeconds(global.cooldown.steal - cooldown, true)}!**`)
      return
    } else {
      let succeed: boolean = Math.random() < 0.5
      let stolenScore: number = Math.floor(Math.max(targetData.score * 0.3 * Math.random(), targetData.score * 0.3 * 0.25))

      if (succeed) {
        await user.misc.scoreGame.setScore(interaction.guild, userData.score + stolenScore)
        await target.misc.scoreGame.setScore(interaction.guild, targetData.score - stolenScore)
        const embed = new EmbedBuilder()
          .setColor(user.author.hexAccentColor)
          .setAuthor({
            name: `${user.author.username}`,
            iconURL: user.author.avatarURL(),
          })
          .setThumbnail(`attachment://${Icon.Robber}`)
          .setDescription(`# You successfully stole __${stolenScore.toLocaleString()}__ from <@${target.author.id}>!`)
          .addFields({
            name: 'Your New Points',
            value: userData.score.toLocaleString(),
            inline: true,
          }, {
            name: `${target.author.username}'s New Points`,
            value: targetData.score.toLocaleString(),
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
        await user.misc.scoreGame.setScore(interaction.guild, Math.max(userData.score - stolenScore, 0))
        const embed = new EmbedBuilder()
          .setColor(user.author.hexAccentColor)
          .setAuthor({
            name: `${user.author.username}`,
            iconURL: user.author.avatarURL(),
          })
          .setThumbnail(`attachment://${Icon.Amputation}`)
          .setDescription(`# You failed to steal from <@${target.author.id}> and lost __${stolenScore.toLocaleString()}__!`)
          .addFields({
            name: 'Your New Points',
            value: userData.score.toLocaleString(),
            inline: true,
          }, {
            name: `${target.author.username}'s New Points`,
            value: targetData.score.toLocaleString(),
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

      await user.misc.scoreGame.setCooldown(interaction.guild, 'steal', Date.now())
    }
  },
  test(): boolean {
    return true
  },
}

export default Steal
