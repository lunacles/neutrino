import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
  User,
} from 'discord.js'
import InteractionObserver from '../interactionobserver.js'
import * as util from '../../utilities/util.js'
import Icon from '../../utilities/icon.js'
import Database from '../../db/database.js'
import { Abort } from '../../types/enum.js'
import global from '../../global.js'

const Leaderboard: CommandInterface = {
  name: 'leaderboard',
  description: `Shows the top 10 users. ${util.formatSeconds(global.cooldown.score)} cooldown.`,
  data: new SlashCommandBuilder(),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()
    const user: User = await util.fetchUser(interaction.user.id)

    //if (interaction.guild.id !== global.testServerId) return await observer.abort(Abort.CommandUnavailableInServer)
    //if (interaction.channel.id !== global.commandChannels.lootLeague && !observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], interaction.channel))
      //return await observer.abort(Abort.CommandRestrictedChannel)

    Database.discord.refreshLeaderboard()
    if (Database.discord.leaderboard.heap.length <= 0) {
      return await observer.abort(Abort.EmptyLeaderboard)
    }
    let top = Database.discord.leaderboard.heap
      .map((user, index: number): string => `**${index + 1}:** <@${user}> - **${Database.discord.users.cache.get(user).score.toLocaleString()}**`)
      .join('\n')

    if (observer.isOnCooldown('leaderboard')) {
      await interaction.editReply(`This command is on cooldown for **${util.formatSeconds(observer.getCooldown('leaderboard'), true)}!**`)
      return
    } else {

      const embed = new EmbedBuilder()
        .setColor(user.accentColor)
        .setAuthor({
          name: `${user.username}`,
          iconURL: user.avatarURL(),
        })
        .setTitle('Top 10 Users')
        .setThumbnail(`attachment://${Icon.Podium}`)
        .setDescription(top)

      await interaction.editReply({
        embeds: [embed],
        files: [{
          attachment: `./src/utilities/assets/${Icon.Podium}`,
          name: Icon.Podium,
        }]
      })

      observer.resetCooldown('leaderboard')
    }
  },
  test(): boolean {
    return true
  },
}

export default Leaderboard
