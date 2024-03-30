import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
} from 'discord.js'
import CommandInterface from './interface.js'

const PingCommand: CommandInterface = {
  name: 'ping',
  description: 'Replies with Pong!',
  data: new SlashCommandBuilder(),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply()
    await interaction.editReply('Pong!')
  },
  test(): boolean {
    return true
  },
}

export default PingCommand
