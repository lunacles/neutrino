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
import config from '../../config.js'
import bot from '../../index.js'

const Claim: CommandInterface = {
  name: 'claim',
  description: `Claim some points! ${util.formatSeconds(config.cooldown.claim)} cooldown.`,
  data: new SlashCommandBuilder().setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()
    const user: User = await bot.fetchUser(interaction.user.id)
    const guildData: DatabaseGuildInstance = await Database.discord.guilds.fetch(interaction.guild)

    try {
      let userData: DatabaseUserInstance = await Database.discord.users.fetch(user)

    if (observer.isOnCooldown('claim')) {
      await interaction.editReply(`This command is on cooldown for **${util.formatSeconds(observer.getCooldown('claim'), true)}!**`)
      return
    const userData = await observer.getGuildUserData()
    await userData.setScore(userData.score + claimedScore)

      const embed = new EmbedBuilder()
        .setColor(user.accentColor)
        .setAuthor({
          name: `${user.username}`,
          iconURL: user.avatarURL(),
        })
        .setThumbnail(`attachment://${icon}`)
        .setDescription(`# You have claimed **${claimedScore.toLocaleString()} points!**`)

      await interaction.editReply({
        embeds: [embed],
        files: [{
          attachment: `./src/utilities/assets/${icon}`,
          name: icon,
        }]
      })
    }
  },
  test(): boolean {
    return true
  },
}

export default Claim
