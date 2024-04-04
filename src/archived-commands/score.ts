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
import Icon from '../utilities/icon.js'

const Score: CommandInterface = {
  name: 'score',
  description: `Shows the given user\'s current points. ${util.formatSeconds(global.cooldown.score)} cooldown.`,
  data: new SlashCommandBuilder()
    .addUserOption((option: SlashCommandUserOption ): SlashCommandUserOption => option
      .setName('user')
      .setDescription('The user to check the points of.')
    ),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply()
    const targetUserOption = interaction.options.getUser('user', false)
    const observer = new InteractionObserver(interaction)
    let author = await Database.getUser(interaction.user.id, interaction.guild)

    if (interaction.guild.id !== global.arrasDiscordId) return await observer.abort(3)
    let targetUser: string = targetUserOption ? targetUserOption.id : interaction.user.id

    let user =  await Database.getUser(targetUser, interaction.guild)
    let data = user.data.scoregame.data
    let cooldown: number = Math.floor((Date.now() - data.cooldown.score) / 1e3)
    if (cooldown < global.cooldown.score) {
      interaction.editReply(`This command is on cooldown for **${util.formatSeconds(global.cooldown.score - cooldown, true)}!**`)
      return
    } else {
      const embed = new EmbedBuilder()
        .setColor(user.author.hexAccentColor)
        .setAuthor({
          name: `${user.author.username}`,
          iconURL: user.author.avatarURL(),
        })
        .setThumbnail(`attachment://${Icon.PiggyBank}`)
        .setDescription(`# <@${user.data.id}>'s current balance is **${data.score.toLocaleString()}!**`)

      interaction.editReply({
        embeds: [embed],
        files: [{
          attachment: `./src/utilities/assets/${Icon.PiggyBank}`,
          name: Icon.PiggyBank,
        }]
      })

      await author.misc.scoreGame.setCooldown(interaction.guild, 'score', Date.now())
    }
  },
  test(): boolean {
    return true
  },
}

export default Score
