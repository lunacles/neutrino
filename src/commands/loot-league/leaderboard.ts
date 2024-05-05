import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js'
import CommandInterface from '../interface.js'
import InteractionObserver from '../interactionobserver.js'
import global from '../../utilities/global.js'
import * as util from '../../utilities/util.js'
import Icon from '../../utilities/icon.js'
import { GuildCollection, GuildCollectionInterface } from '../../user-manager/guildcollection.js'
import { UserDataInterface } from '../../user-manager/userdoc.js'
import { LootLeagueInterface } from '../../user-manager/lootleague.js'

const Leaderboard: CommandInterface = {
  name: 'leaderboard',
  description: `Shows the top 10 users. ${util.formatSeconds(global.cooldown.score)} cooldown.`,
  data: new SlashCommandBuilder(),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply()
    const observer = new InteractionObserver(interaction)
    if (interaction.guild.id !== global.testServerId) return await observer.abort(3)

    let guild: GuildCollectionInterface = await GuildCollection.fetch(interaction.guildId)
    let userData: UserDataInterface = await guild.fetchMember(interaction.user.id)
    let lootLeague: LootLeagueInterface = userData.lootLeague

    //let top = Array.from(Database.users.values()).sort((a, b) => b.data.scoregame.data.score - (a.data.scoregame.data?.score ?? 0)).slice(0, 10).map((user, index) => `**${index + 1}:** <@${user.data.id}> - **${user.data.scoregame.data.score.toLocaleString()}**`).join('\n')
    let top = Array.from(guild.members.values())
      .filter((user: UserDataInterface): boolean => user && user.lootLeague && typeof user.lootLeague.score === 'number') // Filter out any users without a proper score
      .sort((a: UserDataInterface, b: UserDataInterface): number => {
        let scoreA = a.lootLeague?.score ?? 0
        let scoreB = b.lootLeague?.score ?? 0
        return scoreB - scoreA
      })
      .slice(0, 10)
      .map((user: UserDataInterface, index: number): string => `**${index + 1}:** <@${user.member.id}> - **${user.lootLeague.score.toLocaleString()}**`)
      .join('\n')

    let cooldown: number = Math.floor((Date.now() - lootLeague.cooldown.leaderboard) / 1e3)
    if (cooldown < global.cooldown.leaderboard) {
      interaction.editReply(`This command is on cooldown for **${util.formatSeconds(global.cooldown.leaderboard - cooldown, true)}!**`)
      return
    } else {

      const embed = new EmbedBuilder()
        .setColor(userData.user.hexAccentColor)
        .setAuthor({
          name: `${userData.user.username}`,
          iconURL: userData.user.avatarURL(),
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

      await lootLeague.setCooldown('leaderboard', Date.now())
    }
  },
  test(): boolean {
    return true
  },
}

export default Leaderboard
