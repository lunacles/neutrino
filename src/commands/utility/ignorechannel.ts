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
    const observer = new InteractionObserver(interaction)
    const channel: TextChannel = interaction.options.getChannel('channel')
    const remove: boolean = interaction.options.getBoolean('remove') ?? false

    if (!observer.checkPermissions([PermissionsBitField.Flags.ManageChannels], interaction.channel)) {
      await observer.killInteraction(Abort.InsufficientPermissions)
      return
    }

    if (!channel) {
      await observer.killInteraction(Abort.ChannelNotGiven)
      return
    }

    // defer it
    await observer.defer(true)
    const guildData: DatabaseGuildInstance = await observer.getGuildData()

    if (guildData.ignoredChannels.has(channel.id)) {
      await observer.killInteraction(Abort.AlreadyIgnored)
      return
    } else if (remove) {
      await observer.killInteraction(Abort.NotIgnored)
      return
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
