import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
} from 'discord.js'

const PingCommand: CommandInterface = {
  name: 'ping',
  description: 'Replies with Pong!',
  data: new SlashCommandBuilder().setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.editReply('Pong!')
  },
  test(): boolean {
    return true
  },
}

export default PingCommand
