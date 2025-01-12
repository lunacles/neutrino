import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandIntegerOption,
  SlashCommandChannelOption,
  SlashCommandUserOption,
  TextChannel,
  User,
  Collection,
  Message,
  PermissionsBitField,
} from 'discord.js'
import InteractionObserver from '../interactionobserver.js'
import { Abort } from '../../types/enum.js'

const RemovePins: CommandInterface = {
  name: 'remove-pins',
  description: 'Removes all or a set amount of pins from a channel.',
  data: new SlashCommandBuilder()
    .addChannelOption((option: SlashCommandChannelOption ): SlashCommandChannelOption => option
      .setName('target')
      .setDescription('The channel to remove the pins from.')
      .setRequired(true)
    ).addIntegerOption((option: SlashCommandIntegerOption): SlashCommandIntegerOption => option
      .setName('amount')
      .setDescription('The amount of pins to remove. Removes all if left empty.')
      .setMaxValue(50)
      .setMinValue(1)
    ).addUserOption((option: SlashCommandUserOption): SlashCommandUserOption => option
      .setName('user')
      .setDescription('Users to remove the pins of. Non-discriminatory if left empty.')
    ).setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = new InteractionObserver(interaction)
    const targetChannel: TextChannel = interaction.options.getChannel('target')
    const amount: number = interaction.options.getInteger('amount') ?? 50
    const user: User = interaction.options.getUser('user')

    const pinnedMessages: Collection<string, Message<true>> = await targetChannel.messages.fetchPinned()

    if (!observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], targetChannel)) {
      await observer.killInteraction(Abort.InsufficientPermissions)
      return
    }

    // defer it
    await observer.defer()

    let userAmount = pinnedMessages.filter((value: Message<true>) => value.author.id === user?.id)
    await interaction.editReply(`Unpinning ${user != null ? userAmount.size : pinnedMessages.size} message(s) ${user != null ? `by <@${user.id}> ` : '' }from <#${targetChannel.id}>...`)

    let i: number = 0
    for (let message of pinnedMessages.values()) {
      if (user != null && message.author.id !== user.id) continue
      await message.unpin('Pruned')
      i++
      if (i >= amount) break
    }
  },
  test(): boolean {
    return true
  },
}

export default RemovePins
