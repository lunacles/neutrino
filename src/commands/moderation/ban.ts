import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  EmbedBuilder,
  ColorResolvable,
  SlashCommandUserOption,
  User,
  SlashCommandIntegerOption,
  SlashCommandStringOption,
  PermissionsBitField,
  GuildMember,
} from 'discord.js'
import Colors from '../../canvas/palette.js'
import Emoji from '../../utilities/emoji.js'
import InteractionObserver from '../interactionobserver.js'
import { Abort } from '../../types/enum.js'
import * as util from '../../utilities/util.js'
import Secret from '../../utilities/secret.js'
import Log from '../../utilities/log.js'
import bot from '../../index.js'
import Database from '../../db/database.js'

const Ban: CommandInterface = {
  name: 'ban',
  description: 'Ban a provided user.',
  data: new SlashCommandBuilder()
  .addUserOption((option: SlashCommandUserOption): SlashCommandUserOption => option
    .setName('user')
    .setDescription('The user being banned.')
  ).addStringOption((option: SlashCommandStringOption): SlashCommandStringOption => option
    .setName('user-id')
    .setDescription('The user ID being banned.')
  ).addStringOption((option: SlashCommandStringOption): SlashCommandStringOption => option
    .setName('reason')
    .setDescription('The reason the user is being banned for.')
  ).addStringOption((option: SlashCommandStringOption): SlashCommandStringOption => option
    .setName('duration')
    .setDescription('The amount of time the user should be banned for. Default is permanent.')
  ).addIntegerOption((option: SlashCommandIntegerOption): SlashCommandIntegerOption => option
    .setName('remove-message-history')
    .setDescription('Removes the banned user\'s messages from a provided time period. Default is none.')
    .addChoices(...[{
      name: 'None',
      value: 0
    }, {
      name: 'Previous hour',
      value: 60 ** 2
    }, {
      name: 'Previous 6 hours',
      value: 60 ** 2 * 6
    }, {
      name: 'Previous 12 hours',
      value: 60 ** 2 * 12
    }, {
      name: 'Previous 24 hours',
      value: 60 ** 2 * 24
    }])
  ),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = new InteractionObserver(interaction)

    const user: User = interaction.options.getUser('user')
    const id: string = interaction.options.getString('user-id')

    const reason: string = interaction.options.getString('reason') ?? 'No reason provided.'
    const duration: string = interaction.options.getString('duration')
    const removeHistory: number = interaction.options.getInteger('remove-message-history') ?? 0

    // Tell them to fuck off if they dont have sufficient permissions
    if (!observer.checkPermissions([PermissionsBitField.Flags.BanMembers], interaction.channel)) {
      await observer.killInteraction(Abort.InsufficientPermissions)
      return
    }

    if (!user && !id)  {// another way of writing: interaction.user === 'retard'
      await observer.killInteraction(Abort.TargetNotGiven)
      return
    }

    const targetMember: GuildMember = await interaction.guild.members.fetch(user.id ?? id)
    if (!targetMember.bannable)  {
      await observer.killInteraction('This user is not bannable!')
      return
    }

    // defer it
    await observer.defer()
    // Get their database instance
    const userData: DatabaseUserInstance = await observer.getUserData(user?.id ?? id)

    // Extract the duration in seconds
    let seconds: number = util.extractTime(duration)
    let expiration: number = Date.now() + seconds * 1e3

    let neutrinoBanId: string = Secret.id(`neutrino::${user?.id ?? id}::${Math.floor(Date.now())}`, 'ban')
    let banInfo: BanInfo = {
      neutrino_id: neutrinoBanId,
      guild_id: interaction.guildId,
      user_id: userData.id,
      reason,
      expires_at: expiration,
      duration: util.formatSeconds(seconds, false) || 'Permanent',
      timestamp: Date.now(),
    }
    // We dont want a db issue to prevent a user from being banned lol
    try {
      await userData.appendBan(banInfo)
      // TODO: batch this
      await Database.discord.bans.append(banInfo)
      Log.db(`Appending ban for user with id "${user?.id ?? id}"`)
    } catch (err) {
      Log.error(`Failed to append ban to database for user with id "${user?.id ?? id}"`, err)
      // Let me know if we shit our pants
      bot.handleError(interaction, err, true)
    }

    // Ban them
    await interaction.guild.bans.create(user?.id ?? id, {
      deleteMessageSeconds: removeHistory,
      reason
    })

    const embed = new EmbedBuilder()
      .setColor(Colors.ban.hex as ColorResolvable)
      .setDescription(`${Emoji.Ban} **\@${user?.username ?? id}** has been banned.
        **Reason:** ${reason}
        **Duration:** ${util.formatSeconds(seconds, true, 1)}
      `)

    await interaction.editReply({
      embeds: [embed],
    })
  },
  test(): boolean {
    return true
  },
}

export default Ban
