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
import * as util from '../../utilities/util.js'
import Icon from '../../utilities/icon.js'
import config from '../../config.js'
import bot from '../../index.js'

const Score: CommandInterface = {
  name: 'score',
  description: `Shows the given user\'s current points. ${util.formatSeconds(config.cooldown.score)} cooldown.`,
  data: new SlashCommandBuilder()
    .addUserOption((option: SlashCommandUserOption ): SlashCommandUserOption => option
      .setName('user')
      .setDescription('The user to check the points of.')
    ).addStringOption((option: SlashCommandStringOption): SlashCommandStringOption => option
      .setName('id')
      .setDescription('The user id to fetch.')
    ).setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = new InteractionObserver(interaction)
    const user: User = await bot.fetchUser(interaction.options.getString('id', false) ?? interaction.user.id)
    const targetUserOption = interaction.options.getUser('user', false) ?? user

    if (observer.isOnCooldown('score')) {
      await observer.killInteraction(`This command is on cooldown for **${util.formatSeconds(observer.getCooldown('score'), true)}!**`)
      return
    }

    await observer.defer(true)
    const targetData = await observer.getGuildUserData(targetUserOption.id)

    observer.resetCooldown('score')

    const embed = new EmbedBuilder()
      .setColor(user.accentColor)
      .setAuthor({
        name: `${user.username}`,
        iconURL: user.avatarURL(),
      })
      .setThumbnail(`attachment://${Icon.PiggyBank}`)
      .setDescription(`# <@${typeof targetUserOption === 'string' ? targetUserOption : targetUserOption.id}>'s current balance is **${targetData.score.toLocaleString()}!**`)

    await interaction.editReply({
      embeds: [embed],
      files: [{
        attachment: `./src/utilities/assets/${Icon.PiggyBank}`,
        name: Icon.PiggyBank,
      }]
    })
  },
  test(): boolean {
    return true
  },
}

export default Score
