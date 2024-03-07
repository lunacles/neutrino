import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  CacheType,
} from 'discord.js'

interface CommandInterface {
  name: string
  description: string
  data: SlashCommandBuilder,

  execute: (interaction: ChatInputCommandInteraction<CacheType>) => Promise<void>
  test: () => boolean
}

export default CommandInterface
