import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  PermissionsBitField,
  SlashCommandStringOption,
  SlashCommandNumberOption,
} from 'discord.js'
import InteractionObserver from '../interactionobserver.js'
import { Noise } from '../../mazes/algorithms/noise.js'
import generateMaze from '../maze.js'
import config from '../../config.js'
import { Abort } from '../../types/enum.js'

enum Min {
  Dimensions = 16,
  Zoom = 0.001,
  Amplitude = -10,
  Frequency = -10,
  AmplitudeMultiplier = 5,
  FrequencyMultiplier = 10,
}

enum Max {
  Dimensions = 64,
  Zoom = 10,
  Amplitude = 10,
  Frequency = 10,
  AmplitudeMultiplier = 5,
  FrequencyMultiplier = 10,
}

const MultiScaleNoiseMaze: CommandInterface = {
  name: 'multi-scale-noise-maze',
  description: 'Generates a multiscaled noise maze.',
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
      .setName('amplitude')
      .setDescription('The base intensity of noise applied. Default is 1.')
      .setMinValue(Min.Amplitude)
      .setMaxValue(Max.Amplitude)
    ).addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('frequency')
      .setDescription('The base frequency of noise generated features applied. Default is 1.')
      .setMinValue(Min.Frequency)
      .setMaxValue(Max.Frequency)
    ).addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('amplitude-multiplier')
      .setDescription('The amplitude multiplier applied across 3 scales. Default is 0.5.')
      .setMinValue(Min.AmplitudeMultiplier)
      .setMaxValue(Max.AmplitudeMultiplier)
    ).addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('frequency-multiplier')
      .setDescription('The frequency multiplier applied across 3 scales. Default is 2.')
      .setMinValue(Min.FrequencyMultiplier)
      .setMaxValue(Max.FrequencyMultiplier)
    ).setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()
    const seed: string = interaction.options.getString('seed') ?? ''
    const width: number = interaction.options.getNumber('width') ?? 32
    const height: number = interaction.options.getNumber('height') ?? 32
    const zoom: number = interaction.options.getNumber('zoom') ?? 2
    const amplitude: number = interaction.options.getNumber('amplitude') ?? 1
    const frequency: number = interaction.options.getNumber('frequency') ?? 1
    const amplitudeMultiplier: number = interaction.options.getNumber('amplitude-multiplier') ?? 0.5
    const frequencyMultiplier: number = interaction.options.getNumber('frequency-multiplier') ?? 2

    if (interaction.channel.id !== config.commandChannels.mazeGeneration && !observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], interaction.channel))
      return await observer.abort(Abort.CommandRestrictedChannel)

    //if (!observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], interaction.channel)) return await observer.abort(Abort.InsufficientPermissions)
    const algorithm = new Noise()
      .setType('multiScale')
      .setZoom(zoom)
      .setAmplitude(amplitude)
      .setFrequency(frequency)
      .setAmplitudeMultiplier(amplitudeMultiplier)
      .setFrequencyMultiplier(frequencyMultiplier)

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

export default MultiScaleNoiseMaze
