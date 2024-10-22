import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandStringOption,
  SlashCommandNumberOption,
} from 'discord.js'
import { Noise } from '../../mazes/algorithms/noise.js'
import generateMaze from '../maze.js'

enum Min {
  Dimensions = 16,
  Zoom = 0.001,
}

enum Max {
  Dimensions = 64,
  Zoom = 10,
}

const NoiseMaze: CommandInterface = {
  name: 'noise-maze',
  description: 'Generates a noise maze.',
  data: new SlashCommandBuilder()
    .addStringOption((option: SlashCommandStringOption): SlashCommandStringOption => option
      .setName('seed')
      .setDescription('The maze seed. Can be used to recreate the same maze twice.')
    ).addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('width')
      .setDescription('The width of the maze. Default is 32.')
      .setMinValue(Min.Dimensions)
      .setMaxValue(Max.Dimensions)
    ).addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('height')
      .setDescription('The height of the maze. Default is 32.')
      .setMinValue(Min.Dimensions)
      .setMaxValue(Max.Dimensions)
    ).addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('zoom')
      .setDescription('The zoom into the noise algorithm. Default is 4.')
      .setMinValue(Min.Zoom)
      .setMaxValue(Max.Zoom)
    ).setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const seed: string = interaction.options.getString('seed') ?? ''
    const width: number = interaction.options.getNumber('width') ?? 32
    const height: number = interaction.options.getNumber('height') ?? 32
    const zoom: number = interaction.options.getNumber('zoom') ?? 4

    const algorithm = new Noise()
      .setType('normal')
      .setZoom(zoom)

    const [attachment, mazeSeed] = generateMaze(algorithm, seed, width, height)

    await interaction.editReply({
      content: `Here is your maze. (Seed: ${mazeSeed})`,
      files: [attachment],
    })
  },
  test(): boolean {
    return true
  },
}

export default NoiseMaze
