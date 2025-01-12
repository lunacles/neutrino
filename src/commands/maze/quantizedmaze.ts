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
  Threshold = -5,
}

enum Max {
  Dimensions = 64,
  Zoom = 10,
  Threshold = 5,
}

const QuantizedNoiseMaze: CommandInterface = {
  name: 'quantized-noise-maze',
  description: 'Generates a quantized noise maze.',
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
    ).addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('threshold')
      .setDescription('The cutoff value for noise values. Default is 0.1.')
      .setMinValue(Min.Threshold)
      .setMaxValue(Max.Threshold)
    ).setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply()
    const seed: string = interaction.options.getString('seed') ?? ''
    const width: number = interaction.options.getNumber('width') ?? 32
    const height: number = interaction.options.getNumber('height') ?? 32
    const zoom: number = interaction.options.getNumber('zoom') ?? 2
    const threshold: number = interaction.options.getNumber('threshold') ?? 0.1

    const algorithm = new Noise()
      .setType('quantized')
      .setZoom(zoom)
      .setThreshold(threshold)

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

export default QuantizedNoiseMaze
