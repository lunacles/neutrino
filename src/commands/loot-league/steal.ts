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
    const observer = new InteractionObserver(interaction)
    const user: User = await bot.fetchUser(interaction.user.id)
    const targetUserOption = interaction.options.getUser('user', true)

    if (targetUserOption.id === user.id) {
      await observer.killInteraction(Abort.SelfTargetNotAllowed)
      return
    }
    if (targetUserOption.id === config.botId) {
      await observer.killInteraction(Abort.NeutrinoNotAllowed)
      return
    }

    if (observer.isOnCooldown('steal')) {
      await observer.killInteraction(`This command is on cooldown for **${util.formatSeconds(observer.getCooldown('steal'), true)}!**`)
      return
    }

    await observer.defer()
    const [ userData, targetData] = await Promise.all([observer.getGuildUserData(), observer.getGuildUserData(targetUserOption.id)])

    if (userData.shieldEnd > Date.now()) {
      await observer.killInteraction('You cannot steal from someone while you have a shield active!')
      return
    } else if (targetData.score < 250) {
      await observer.killInteraction('You cannot steal from someone with less than 250 points!')
      return
    } else if (userData.score < 250) {
      await observer.killInteraction('You cannot steal from someone if you have less than 250 points!')
      return
    } else if (targetData.shieldEnd > Date.now()) {
      await observer.killInteraction(`You cannot steal from someone who has a shield active!\nTheir shield will expire <t:${Math.floor(targetData.shieldEnd / 1e3)}:R>`)
      return
    }

    const factor: number = 1.65
    const maxChance: number = 0.65
    const clamp: { [key: string]: number } = {
      minGain: 0.05,
      maxGain: 0.3,
      minLoss: 0.125,
      maxLoss: 0.35,
    }

    let chance: number = userData.score / targetData.score * Math.sqrt(factor)
    // penalize players stealing from players with a lower score than theirs
    if (targetData.score <= userData.score)
      chance = targetData.score / userData.score / Math.sqrt(factor)

    // cap the chance at at 65%
    let succeed: boolean = await userData.random() < Math.min(chance, maxChance)

    let stolenScore: number = succeed ?
      // steal at least 5% of target score, at most 30% of target score,
      await userData.fromRange(targetData.score * clamp.minGain, targetData.score * clamp.maxGain, 'Integer') :
      // lose at least 12.5% of own score, at most 35% of own score,
      -(await userData.fromRange(userData.score * clamp.minLoss, userData.score * clamp.maxLoss, 'Integer'))

    await userData.setScore(userData.score + stolenScore)
    await targetData.setScore(targetData.score - stolenScore)
    observer.resetCooldown('score')

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
  },
  test(): boolean {
    return true
  },
}

export default Steal
