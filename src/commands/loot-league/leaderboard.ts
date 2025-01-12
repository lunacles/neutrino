import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  EmbedBuilder,
  User,
} from 'discord.js'
import InteractionObserver from '../interactionobserver.js'
import * as util from '../../utilities/util.js'
import Icon from '../../utilities/icon.js'
import Database from '../../db/database.js'
import { Abort } from '../../types/enum.js'
import config from '../../config.js'
import bot from '../../index.js'

const Leaderboard: CommandInterface = {
  name: 'leaderboard',
  description: `Shows the top 10 users. ${util.formatSeconds(config.cooldown.score)} cooldown.`,
  data: new SlashCommandBuilder().setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()
    const user: User = await bot.fetchUser(interaction.user.id)
    const guildData = await observer.getGuildData()

    let top: Array<string> = []
    for (let [index, user] of await Promise.all(guildData.leaderboard.heap.slice(0, 10).map((user: string): DatabaseUserInstance => {
      let cache = Database.discord.users.cache.get(user)
      return cache
    }).entries())) {
      top.push(`**${index + 1}:** <@${user.data.id}> - **${user.score.toLocaleString()}**`)
    }

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
        .setDescription(top.join('\n'))

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
