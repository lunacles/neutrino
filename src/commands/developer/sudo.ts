import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandStringOption,
  SlashCommandChannelOption,
  TextChannel,
} from 'discord.js'
import InteractionObserver from '../interactionobserver.js'
import config from '../../config.js'
import { Abort } from '../../types/enum.js'

const Sudo: CommandInterface = {
  name: 'sudo',
  description: 'Sudo\'s the bot.',
  data: new SlashCommandBuilder()
    .addChannelOption((option: SlashCommandChannelOption ): SlashCommandChannelOption => option
      .setName('channel')
      .setDescription('The channel to sudo into.')
    ).addStringOption((option: SlashCommandStringOption): SlashCommandStringOption => option
      .setName('channel-id')
      .setDescription('The channel id to sudo the message into.')
    ).addStringOption((option: SlashCommandStringOption): SlashCommandStringOption => option
      .setName('message')
      .setDescription('The message to sudo.')
    ).setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = new InteractionObserver(interaction)
    const targetChannelOption = interaction.options.getChannel('channel', false)
    const targetChannelId = interaction.options.getString('channel-id', false)
    const targetMessage: string = interaction.options.getString('message')

    if (interaction.user.id !== config.ownerId) {
      await observer.killInteraction(Abort.InsufficientPermissions)
      return
    }

    let targetChannel: TextChannel

    if (targetChannelOption instanceof TextChannel) {
      targetChannel = targetChannelOption
    } else if (targetChannelId) {
      try {
        targetChannel = await interaction.client.channels.fetch(targetChannelId) as TextChannel
      } catch (err) {
        return await observer.killInteraction(Abort.InvalidChannelType)
      }
    }
    if (!targetChannel) {
      await observer.killInteraction(Abort.InvalidChannelType)
      return
    }

    await targetChannel.send(targetMessage)

    await interaction.editReply('Sudo successful')
  },
  test(): boolean {
    return true
  },
}

export default Sudo
