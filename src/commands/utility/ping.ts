import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  PermissionsBitField,
} from 'discord.js'
import InteractionObserver from '../interactionobserver.js'
import global from 'global.js'
import { Abort } from 'types/enum.d.js'

const PingCommand: CommandInterface = {
  name: 'ping',
  description: 'Replies with Pong!',
  data: new SlashCommandBuilder(),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()

    if (interaction.channel.id !== global.commandChannels.misc && !observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], interaction.channel))
      return await observer.abort(Abort.CommandRestrictedChannel)

    await interaction.editReply('Pong!')
  },
  test(): boolean {
    return true
  },
}

export default PingCommand
