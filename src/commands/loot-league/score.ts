import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandUserOption,
  EmbedBuilder,
  PermissionsBitField,
} from 'discord.js'
import {
  CommandInterface,
  GuildCollectionInterface,
  UserDataInterface,
  LootLeagueInterface,
} from '../../types.js'
import GuildCollection from '../../user-manager/guildcollection.js'
import InteractionObserver from '../interactionobserver.js'
import global from '../../global.js'
import * as util from '../../utilities/util.js'
import Icon from '../../utilities/icon.js'

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
    //if (interaction.guild.id !== global.testServerId) return await observer.abort(3)
    if (interaction.channel.id !== '1227836204087640084' && !observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], interaction.channel)) return await observer.abort(5)

    let guild: GuildCollectionInterface = await GuildCollection.fetch(interaction.guildId)
    let authorData: UserDataInterface = await guild.fetchMember(interaction.user.id)

    let targetUser: string = targetUserOption ? targetUserOption.id : interaction.user.id
    let targetData: UserDataInterface = await guild.fetchMember(targetUser)

    let lootLeague: LootLeagueInterface = authorData.lootLeague
    let cooldown: number = Math.floor((Date.now() - lootLeague.cooldown.score) / 1e3)
    if (cooldown < global.cooldown.score) {
      interaction.editReply(`This command is on cooldown for **${util.formatSeconds(global.cooldown.score - cooldown, true)}!**`)
      return
    } else {
      const embed = new EmbedBuilder()
        .setColor(authorData.user.hexAccentColor)
        .setAuthor({
          name: `${authorData.user.username}`,
          iconURL: authorData.user.avatarURL(),
        })
        .setThumbnail(`attachment://${Icon.PiggyBank}`)
        .setDescription(`# <@${targetData.user.id}>'s current balance is **${targetData.lootLeague.score.toLocaleString()}!**`)

      interaction.editReply({
        embeds: [embed],
        files: [{
          attachment: `./src/utilities/assets/${Icon.PiggyBank}`,
          name: Icon.PiggyBank,
        }]
      })

      await lootLeague.setCooldown('score', Date.now())
    }
  },
  test(): boolean {
    return true
  },
}

export default Score
