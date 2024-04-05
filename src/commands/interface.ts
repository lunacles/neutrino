import {
  ChatInputCommandInteraction,
  CacheType,
} from 'discord.js'

interface CommandInterface {
  name: string
  description: string
  data: any,

  execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void>
  test(): boolean
}

export default CommandInterface
