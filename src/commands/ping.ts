import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
} from 'discord.js'
import CommandInterface from './default.js'

const PingCommand: CommandInterface = {
  name: 'ping',
  description: 'Replies with Pong!',
  data: new SlashCommandBuilder(),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.reply('Pong!')
  },
  test(): boolean {
    return true
  },
}

export default PingCommand
