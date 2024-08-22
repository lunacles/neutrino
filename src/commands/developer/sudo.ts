import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandStringOption,
  SlashCommandChannelOption,
  TextChannel,
} from 'discord.js'
import InteractionObserver from '../interactionobserver.js'
import global from '../../global.js'
import { Abort } from 'types/enum.d.js'
const Sudo: CommandInterface = {
  name: 'sudo',
  description: 'Sudo\'s the bot.',
  data: new SlashCommandBuilder()
    .addChannelOption((option: SlashCommandChannelOption ): SlashCommandChannelOption => option
      .setName('channel')
      .setDescription('The channel to sudo into.')
    )
    .addStringOption((option: SlashCommandStringOption): SlashCommandStringOption => option
      .setName('channel-id')
      .setDescription('The channel id to sudo the message into.')
    )
    .addStringOption((option: SlashCommandStringOption): SlashCommandStringOption => option
    .setName('message')
    .setDescription('The message to sudo.')
  ),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()
    const targetChannelOption = interaction.options.getChannel('channel', false)
    const targetChannelId = interaction.options.getString('channel-id', false)
    const targetMessage: string = interaction.options.getString('message')

    if (interaction.user.id !== global.ownerId) return await observer.abort(Abort.InsufficientPermissions)
    let targetChannel: TextChannel

    if (targetChannelOption instanceof TextChannel) {
      targetChannel = targetChannelOption
    } else if (targetChannelId) {
      try {
        targetChannel = await interaction.client.channels.fetch(targetChannelId) as TextChannel
      } catch (err) {
        return await observer.abort(Abort.InvalidChannelType)
      }
    }
    if (!targetChannel) return await observer.abort(Abort.InvalidChannelType)

    await targetChannel.send(targetMessage)

    await interaction.editReply('Sudo successful')
  },
  test(): boolean {
    return true
  },
}

export default Sudo
