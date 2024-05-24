import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandStringOption,
  SlashCommandChannelOption,
  TextChannel,
} from 'discord.js'
import {
  CommandInterface,
} from '../../types.js'
import InteractionObserver from '../interactionobserver.js'
import global from '../../utilities/global.js'
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
    await interaction.deferReply()
    const targetChannelOption = interaction.options.getChannel('channel', false)
    const targetChannelId = interaction.options.getString('channel-id', false)
    const targetMessage: string = interaction.options.getString('message')
    const observer = new InteractionObserver(interaction)

    if (interaction.user.id !== global.ownerId) return await observer.abort(0)
    let targetChannel: TextChannel

    if (targetChannelOption instanceof TextChannel) {
      targetChannel = targetChannelOption
    } else if (targetChannelId) {
      try {
        targetChannel = await interaction.client.channels.fetch(targetChannelId) as TextChannel
      } catch (err) {
        return await observer.abort(2)
      }
    }
    if (!targetChannel) return await observer.abort(2)

    await targetChannel.send(targetMessage)

    await interaction.editReply('Sudo successful')
  },
  test(): boolean {
    return true
  },
}

export default Sudo
