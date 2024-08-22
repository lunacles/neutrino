import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandUserOption,
  EmbedBuilder,
  PermissionsBitField,
  User,
} from 'discord.js'
//import GuildCollection from '../../user-manager/guildcollection.js'
import InteractionObserver from '../interactionobserver.js'
import global from 'global.js'
import * as util from '../../utilities/util.js'
import Icon from '../../utilities/icon.js'
import Database from 'db/database.js'
import { Abort } from 'types/enum.d.js'

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
    const observer = await new InteractionObserver(interaction).defer()
    const user: User = await util.fetchUser(interaction.user.id)
    const targetUserOption = interaction.options.getUser('user', true)

    //if (interaction.guild.id !== global.testServerId) return await observer.abort(Abort.CommandUnavailableInServer)
    //if (interaction.channel.id !== global.commandChannels.lootLeague && !observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], interaction.channel))
      //return await observer.abort(Abort.CommandRestrictedChannel)

    if (targetUserOption.id === user.id) return await observer.abort(Abort.SelfTargetNotAllowed)

    let userData: DatabaseInstanceInterface = await Database.discord.users.fetch(user.id)
    let targetData: DatabaseInstanceInterface = await Database.discord.users.fetch(targetUserOption.id)

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
      let chance: number = userData.score / targetData.score * Math.sqrt(factor)
      // pentalize players stealing from players with a lower score than theirs
      if (targetData.score <= userData.score)
        chance = targetData.score / userData.score / Math.sqrt(factor)

      // cap the chance at at 65%
      let succeed: boolean = await userData.random() < Math.min(chance, 0.65)

      let stolenScore: number = succeed ?
        // steal at least 5% of target score, at most 30% of target score,
        await userData.fromRange(targetData.score * 0.05, targetData.score * 0.3, 'Integer') :
        // lose at least 12.5% of own score, at most 35% of own score,
        -(await userData.fromRange(userData.score * 0.125, userData.score * 0.35, 'Integer'))

      await userData.setScore(userData.score + stolenScore)
      await targetData.setScore(targetData.score - stolenScore)

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
