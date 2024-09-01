import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandUserOption,
  EmbedBuilder,
  User,
  SlashCommandStringOption,
  AutocompleteInteraction,
} from 'discord.js'
//import GuildCollection from '../../user-manager/guildcollection.js'
import InteractionObserver from '../interactionobserver.js'
import * as util from '../../utilities/util.js'
import Icon from '../../utilities/icon.js'
import Database from '../../db/database.js'
import config from '../../config.js'
import AutoComplete from '../autocomplete.js'
import bot from '../../index.js'

const Score: CommandInterface = {
  name: 'score',
  description: `Shows the given user\'s current points. ${util.formatSeconds(config.cooldown.score)} cooldown.`,
  data: new SlashCommandBuilder()
    .addUserOption((option: SlashCommandUserOption ): SlashCommandUserOption => option
      .setName('user')
      .setDescription('The user to check the points of.')
    ).addStringOption((option: SlashCommandStringOption): SlashCommandStringOption => option
      .setName('neutrino-id')
      .setDescription('The neutrino id to fetch.')
      .setAutocomplete(true)
    ),
  async autocomplete(interaction: AutocompleteInteraction<CacheType>) {
    let focused: string = interaction.options.getFocused()
    let filter = AutoComplete.fetch(focused)
    await interaction.respond(filter.map(choice => ({ name: choice, value: choice })))
  },
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()
    const user: User = await bot.fetchUser(interaction.user.id)
    const targetUserOption = interaction.options.getUser('user', false) ?? interaction.options.getString('neutrino-id', false) ?? user

    //if (interaction.guild.id !== config.testServerId) return await observer.abort(Abort.CommandUnavailableInServer)
    //if (interaction.channel.id !== config.commandChannels.lootLeague && !observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], interaction.channel))
      //return await observer.abort(Abort.CommandRestrictedChannel)

    let targetData: DatabaseInstanceInterface = await Database.discord.users.fetch(typeof targetUserOption === 'string' ? targetUserOption : targetUserOption.id)

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
        .setDescription(`# <@${typeof targetUserOption === 'string' ? targetUserOption : targetUserOption.id}>'s current balance is **${targetData.score.toLocaleString()}!**`)

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
