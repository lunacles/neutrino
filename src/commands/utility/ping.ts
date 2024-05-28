import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  PermissionsBitField,
} from 'discord.js'
import {
  CommandInterface,
} from '../../types.js'
import InteractionObserver from '../interactionobserver.js'
import global from 'global.js'

const PingCommand: CommandInterface = {
  name: 'ping',
  description: 'Replies with Pong!',
  data: new SlashCommandBuilder(),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply()
    const observer = new InteractionObserver(interaction)

    if (interaction.channel.id !== global.commandChannels.misc && !observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], interaction.channel))
      return await observer.abort(8)

    await interaction.editReply('Pong!')
  },
  test(): boolean {
    return true
  },
}

export default PingCommand
