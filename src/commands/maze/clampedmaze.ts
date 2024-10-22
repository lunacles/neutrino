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
  Clamp = -5,
}

enum Max {
  Dimensions = 64,
  Zoom = 10,
  Clamp = 5,
}

const ClampedNoiseMaze: CommandInterface = {
  name: 'clamped-noise-maze',
  description: 'Generates a clamped noise maze.',
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
      .setName('min')
      .setDescription('Only noise values higher than this minimum will be considered valid. Default is -0.085.')
      .setMinValue(Min.Clamp)
      .setMaxValue(Max.Clamp)
    ).addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('max')
      .setDescription('Only noise values lower than this maximum will be considered valid. Default is 0.085')
      .setMinValue(Min.Clamp)
      .setMaxValue(Max.Clamp)
    ).setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const seed: string = interaction.options.getString('seed') ?? ''
    const width: number = interaction.options.getNumber('width') ?? 32
    const height: number = interaction.options.getNumber('height') ?? 32
    const zoom: number = interaction.options.getNumber('zoom') ?? 4
    const min: number = interaction.options.getNumber('min') ?? -0.085
    const max: number = interaction.options.getNumber('max') ?? 0.085

    const algorithm = new Noise()
      .setType('clamped')
      .setZoom(zoom)
      .setClamp(min, max)

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

export default ClampedNoiseMaze
