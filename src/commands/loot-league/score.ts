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
import * as util from '../../utilities/util.js'
import Icon from '../../utilities/icon.js'
import Database from 'db/database.js'
import { Abort } from 'types/enum.d.js'
import global from 'global.js'

const Score: CommandInterface = {
  name: 'score',
  description: `Shows the given user\'s current points. ${util.formatSeconds(global.cooldown.score)} cooldown.`,
  data: new SlashCommandBuilder()
    .addUserOption((option: SlashCommandUserOption ): SlashCommandUserOption => option
      .setName('user')
      .setDescription('The user to check the points of.')
    ),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()
    const user: User = await util.fetchUser(interaction.user.id)
    const targetUserOption = interaction.options.getUser('user', false) ?? user

    //if (interaction.guild.id !== global.testServerId) return await observer.abort(Abort.CommandUnavailableInServer)
    if (interaction.channel.id !== global.commandChannels.lootLeague && !observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], interaction.channel))
      return await observer.abort(Abort.CommandRestrictedChannel)

    let targetData: DatabaseInstanceInterface = await Database.discord.users.fetch(targetUserOption.id)

    if (observer.isOnCooldown('score')) {
      await interaction.editReply(`This command is on cooldown for **${util.formatSeconds(observer.getCooldown('score'), true)}!**`)
      return
    } else {
      const embed = new EmbedBuilder()
        .setColor(user.accentColor)
        .setAuthor({
          name: `${user.username}`,
          iconURL: user.avatarURL(),
        })
        .setThumbnail(`attachment://${Icon.PiggyBank}`)
        .setDescription(`# <@${targetUserOption.id}>'s current balance is **${targetData.score.toLocaleString()}!**`)

      await interaction.editReply({
        embeds: [embed],
        files: [{
          attachment: `./src/utilities/assets/${Icon.PiggyBank}`,
          name: Icon.PiggyBank,
        }]
      })

      observer.resetCooldown('score')
    }
  },
  test(): boolean {
    return true
  },
}

export default Score
