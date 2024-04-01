import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js'
import CommandInterface from './interface.js'
import InteractionObserver from './interactionobserver.js'
import global from '../global.js'
import {
  Database
} from '../firebase/database.js'
import * as util from '../utilities/util.js'
import UserData from '../firebase/userdoc.js'
import Icon from '../utilities/icon.js'

const Leaderboard: CommandInterface = {
  name: 'leaderboard',
  description: `Shows the top 10 users. ${util.formatSeconds(global.cooldown.score)} cooldown.`,
  data: new SlashCommandBuilder(),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply()
    const observer = new InteractionObserver(interaction)
    if (interaction.guild.id !== global.arrasDiscordId) return await observer.abort(3)

    let user = Database.users.get(interaction.user.id) ?? await UserData.new(interaction.user.id, interaction.guild)
    let data = user.data.scoregame.data
    //let top = Array.from(Database.users.values()).sort((a, b) => b.data.scoregame.data.score - (a.data.scoregame.data?.score ?? 0)).slice(0, 10).map((user, index) => `**${index + 1}:** <@${user.data.id}> - **${user.data.scoregame.data.score.toLocaleString()}**`).join('\n')
    let top = Array.from(Database.users.values())
      .filter(u => u.data && u.data.scoregame && u.data.scoregame.data && typeof u.data.scoregame.data.score === 'number') // Filter out any users without a proper score
      .sort((a, b) => {
        const scoreA = a.data.scoregame.data?.score ?? 0;
        const scoreB = b.data.scoregame.data?.score ?? 0;
        return scoreB - scoreA;
      })
      .slice(0, 10)
      .map((user, index) => `**${index + 1}:** <@${user.data.id}> - **${user.data.scoregame.data.score.toLocaleString()}**`)
      .join('\n')

    let cooldown: number = Math.floor((Date.now() - data.cooldown.leaderboard) / 1e3)
    if (cooldown < global.cooldown.leaderboard) {
      interaction.editReply(`This command is on cooldown for **${util.formatSeconds(global.cooldown.leaderboard - cooldown, true)}!**`)
      return
    } else {

      const embed = new EmbedBuilder()
        .setColor(user.author.hexAccentColor)
        .setAuthor({
          name: `${user.author.username}`,
          iconURL: user.author.avatarURL(),
        })
        .setTitle('Top 10 Users')
        .setThumbnail(`attachment://${Icon.Podium}`)
        .setDescription(top)

      interaction.editReply({
        embeds: [embed],
        files: [{
          attachment: `./src/utilities/assets/${Icon.Podium}`,
          name: Icon.Podium,
        }]
      })

      await user.misc.scoreGame.setCooldown(interaction.guild, 'leaderboard', Date.now())
    }
  },
  test(): boolean {
    return true
  },
}

export default Leaderboard
