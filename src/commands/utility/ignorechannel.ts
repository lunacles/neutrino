import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandBooleanOption,
  PermissionsBitField,
  SlashCommandChannelOption,
  TextChannel,
} from 'discord.js'
import InteractionObserver from '../interactionobserver.js'
import Database from '../../db/database.js'
import { Abort } from '../../types/enum.js'

const IgnoreChannel: CommandInterface = {
  name: 'ignore-channel',
  description: 'Add or remove a channel from the ignore list.',
  data: new SlashCommandBuilder()
  .addChannelOption((option: SlashCommandChannelOption): SlashCommandChannelOption => option
    .setName('channel')
    .setDescription('The channel you want Neutrino to ignore interactions in.')
    .setRequired(true),
  ).addBooleanOption((option: SlashCommandBooleanOption): SlashCommandBooleanOption => option
    .setName('remove')
    .setDescription('Allow Neutrino to see interactions the selected channel again.')
  ),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()
    const channel: TextChannel = interaction.options.getChannel('channel')
    const remove: boolean = interaction.options.getBoolean('remove') ?? false

    if (!observer.checkPermissions([PermissionsBitField.Flags.ManageChannels], interaction.channel))
      return await observer.abort(Abort.InsufficientPermissions)

    if (!channel)
      return await observer.abort(Abort.ChannelNotGiven)

    let guildData: DatabaseGuildInstance = await Database.discord.guilds.fetch(interaction.guildId)

    if (guildData.ignoredChannels.has(channel.id)) {
      return await observer.abort(Abort.AlreadyIgnored)
    } else if (remove) {
      return await observer.abort(Abort.NotIgnored)
    }

    if (remove) {
      await guildData.removeIgnoredChannel(channel.id)
      interaction.editReply(`Removed ${channel.name} from the ignored channels.`)
    } else {
      await guildData.addIgnoredChannel(channel.id)
      interaction.editReply(`Added ${channel.name} to the ignored channels.`)
    }
  },
  test(): boolean {
    return true
  },
}

export default IgnoreChannel
