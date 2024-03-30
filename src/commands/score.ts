import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandUserOption,
} from 'discord.js'
import CommandInterface from './interface.js'
import InteractionObserver from './interactionobserver.js'
import global from '../global.js'
import {
  Database
} from '../firebase/database.js'
import * as util from '../utilities/util.js'
import UserData from '../firebase/userdoc.js'

const Score: CommandInterface = {
  name: 'score',
  description: `Shows the given user\'s current score. ${util.formatSeconds(global.cooldown.score)} cooldown.`,
  data: new SlashCommandBuilder()
    .addUserOption((option: SlashCommandUserOption ): SlashCommandUserOption => option
      .setName('user')
      .setDescription('The user to check the score of.')
    ),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply()
    const targetUserOption = interaction.options.getUser('user', false)
    const observer = new InteractionObserver(interaction)
    let author = Database.users.get(interaction.user.id) ?? await UserData.new(interaction.user.id, interaction.guild)

    if (interaction.guild.id !== global.arrasDiscordId) return await observer.abort(3)
    let targetUser: string = targetUserOption ? targetUserOption.id : interaction.user.id

    let user = Database.users.get(targetUser) ?? await UserData.new(targetUser, interaction.guild)
    let data = user.data.scoregame.data
    let cooldown: number = Math.floor((Date.now() - data.cooldown.score) / 1e3)
    if (cooldown < global.cooldown.score) {
      interaction.editReply(`This command is on cooldown for **${util.formatSeconds(global.cooldown.score - cooldown, true)}!**`)
      return
    } else {
      interaction.editReply(`<@${user.data.id}>'s current balance is **${data.score.toLocaleString()}!**`)
      await author.misc.scoreGame.setCooldown(interaction.guild, 'score', Date.now())
    }
  },
  test(): boolean {
    return true
  },
}

export default Score
