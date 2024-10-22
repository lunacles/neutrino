import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandUserOption,
  EmbedBuilder,
  User,
  SlashCommandStringOption,
} from 'discord.js'
//import GuildCollection from '../../user-manager/guildcollection.js'
import InteractionObserver from '../interactionobserver.js'
import config from '../../config.js'
import * as util from '../../utilities/util.js'
import Icon from '../../utilities/icon.js'
import Database from '../../db/database.js'
import { Abort } from '../../types/enum.js'
import bot from '../../index.js'

const Steal: CommandInterface = {
  name: 'steal',
  description: `Attempt to steal some points from anotehr player! ${util.formatSeconds(config.cooldown.steal)} cooldown.`,
  data: new SlashCommandBuilder()
  .addUserOption((option: SlashCommandUserOption ): SlashCommandUserOption => option
    .setName('user')
    .setDescription('The user to steal from.')
    .setRequired(true)
  ).addStringOption((option: SlashCommandStringOption): SlashCommandStringOption => option
    .setName('neutrino-id')
    .setDescription('The neutrino id to fetch.')
  ).setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()
    const user: User = await bot.fetchUser(interaction.user.id)
    const targetUserOption = interaction.options.getUser('user', true)
    const guildData: DatabaseGuildInstance = await Database.discord.guilds.fetch(interaction.guild)

    if (targetUserOption.id === user.id) return await observer.abort(Abort.SelfTargetNotAllowed)
    if (targetUserOption.id === config.botId) return await observer.abort(Abort.NeutrinoNotAllowed)
    let userData: DatabaseUserInstance = await Database.discord.users.fetch(user.id)
    let targetData: DatabaseUserInstance = await Database.discord.users.fetch(targetUserOption.id)

    if (userData.shieldEnd > Date.now()) {
      await interaction.editReply('You cannot steal from someone while you have a shield active!')
      return
    } else if (targetData.score < 250) {
      await interaction.editReply('You cannot steal from someone with less than 250 points!')
      return
    } else if (targetData.score < 250) {
      await interaction.editReply('You cannot steal from someone if you have less than 250 points!')
      return
    } else if (targetData.shieldEnd > Date.now()) {
      await interaction.editReply(`You cannot steal from someone who has a shield active!\nTheir shield will expire <t:${Math.floor(targetData.shieldEnd / 1e3)}:R>`)
      return
    }

    if (observer.isOnCooldown('steal')) {
      await interaction.editReply(`This command is on cooldown for **${util.formatSeconds(observer.getCooldown('steal'), true)}!**`)
      return
    } else {
      const factor: number = 1.65
      const maxChance: number = 0.65
      const clamp: { [key: string]: number } = {
        minGain: 0.05,
        maxGain: 0.3,

        minLoss: 0.125,
        maxLoss: 0.35,
      }

      let chance: number = userData.score / targetData.score * Math.sqrt(factor)
      // pentalize players stealing from players with a lower score than theirs
      if (targetData.score <= userData.score)
        chance = targetData.score / userData.score / Math.sqrt(factor)

      // cap the chance at at 65%
      let succeed: boolean = await userData.random() < Math.min(chance, maxChance)

      let stolenScore: number = succeed ?
        // steal at least 5% of target score, at most 30% of target score,
        await userData.fromRange(targetData.score * clamp.minGain, targetData.score * clamp.maxGain, 'Integer') :
        // lose at least 12.5% of own score, at most 35% of own score,
        -(await userData.fromRange(userData.score * clamp.minLoss, userData.score * clamp.maxLoss, 'Integer'))

      await observer.applyScore(userData, guildData, userData.score + stolenScore)
      await observer.applyScore(targetData, guildData, targetData.score - stolenScore)

      let icon = succeed ? Icon.Robber : Icon.Amputation

      const embed = new EmbedBuilder()
        .setColor(user.accentColor)
        .setAuthor({
          name: `${user.username}`,
          iconURL: user.avatarURL(),
        })
        .setThumbnail(`attachment://${icon}`)
        .setDescription(succeed ?
          `# You successfully stole __${stolenScore.toLocaleString()}__ from <@${targetUserOption.id}>!` :
          `# You failed to steal from <@${targetUserOption.id}> and lost __${stolenScore.toLocaleString()}__!`
        )
        .addFields({
          name: 'Your New Points',
          value: userData.score.toLocaleString(),
          inline: true,
        }, {
          name: `${targetUserOption.username}'s New Points`,
          value: targetData.score.toLocaleString(),
          inline: true,
        })

      await interaction.editReply({
        embeds: [embed],
        files: [{
          attachment: `./src/utilities/assets/${icon}`,
          name: icon,
        }]
      })

      observer.resetCooldown('score')
    }
  },
  test(): boolean {
    return true
  },
}

export default Steal
