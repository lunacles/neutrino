import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandBooleanOption,
  PermissionsBitField,
  SlashCommandStringOption,
  SlashCommandNumberOption,
} from 'discord.js'
import {
  CommandInterface,
} from '../../types.js'
import InteractionObserver from '../interactionobserver.js'
import { RandomWalker } from '../../mazes/algorithms/randomwalker.js'
import global from '../../global.js'
import generateMaze from '../maze.js'

enum Min {
  Dimensions = 16,
  Length = 0,
  Turns = 0,
  Branches = 0,
  Seeds = 1,
  Chance = 0,
}

enum Max {
  Dimensions = 64,
  Length = 50,
  Turns = 50,
  Branches = 5,
  Seeds = 100,
  Chance = 1,
}

const SeedMaze: CommandInterface = {
  name: 'seed-maze',
  description: 'Generates a seed maze.',
  data: new SlashCommandBuilder()
    .addStringOption((option: SlashCommandStringOption): SlashCommandStringOption => option
      .setName('seed')
      .setDescription('The maze seed. Can be used to recreate the same maze twice.')
    )
    .addBooleanOption((option: SlashCommandBooleanOption): SlashCommandBooleanOption => option
      .setName('placement-type')
      .setDescription('What the walker places. True for empty, false for walls.')
    )
    .addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('width')
      .setDescription('The width of the maze. Default is 32.')
      .setMinValue(Min.Dimensions)
      .setMaxValue(Max.Dimensions)
    )
    .addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('height')
      .setDescription('The height of the maze. Default is 32.')
      .setMinValue(Min.Dimensions)
      .setMaxValue(Max.Dimensions)
    )
    .addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('seed-amount')
      .setDescription('The amount of walker seeds. Default is 75.')
      .setMinValue(Min.Seeds)
      .setMaxValue(Max.Seeds)
    )
    .addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('straight-chance')
      .setDescription('The chance for a walker to move forward in the direction it\'s facing. Default its 0.6.')
      .setMinValue(Min.Chance)
      .setMaxValue(Max.Chance)
    )
    .addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('turn-chance')
      .setDescription('The chance for a walker to turn to a new direction. Runs if straight chance fails. Default is 0.4.')
      .setMinValue(Min.Chance)
      .setMaxValue(Max.Chance)
    )
    .addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('branch-chance')
      .setDescription('The chance for a walker to branch a new walker. Runs if straight & turn chance fails. Default is 0.')
      .setMinValue(Min.Chance)
      .setMaxValue(Max.Chance)
    )
    .addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('min-length')
      .setDescription('The minimum length a walker can be. Default is 0.')
      .setMinValue(Min.Length)
      .setMaxValue(Max.Length)
    )
    .addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('min-turns')
      .setDescription('The minimum turns a walker can make. Default is 0.')
      .setMinValue(Min.Turns)
      .setMaxValue(Max.Turns)
    )
    .addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('min-branches')
      .setDescription('The minimum branches a walker can create. Default is 0.')
      .setMinValue(Min.Branches)
      .setMaxValue(Max.Branches)
    )
    .addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('max-length')
      .setDescription('The maximum length a walker can be. Default is 50.')
      .setMinValue(Min.Length)
      .setMaxValue(Max.Length)
    )
    .addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('max-turns')
      .setDescription('The maximum turns a walker can make. Default is 50.')
      .setMinValue(Min.Turns)
      .setMaxValue(Max.Turns)
    )
    .addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('max-branches')
      .setDescription('The maximum branches a walker can create. Default is 0.')
      .setMinValue(Min.Branches)
      .setMaxValue(Max.Branches)
    )
    .addBooleanOption((option: SlashCommandBooleanOption): SlashCommandBooleanOption => option
      .setName('border-wrapping')
      .setDescription('If a walker moves outside of the map boundary, make it wrap to the other side. Default is false.')
    )
    .addBooleanOption((option: SlashCommandBooleanOption): SlashCommandBooleanOption => option
      .setName('terminate-on-contact')
      .setDescription('If a walker runs into another walker, terminate it. Default is false.')
    ),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply()
    const seed: string = interaction.options.getString('seed') ?? ''
    const width: number = interaction.options.getNumber('width') ?? 32
    const height: number = interaction.options.getNumber('height') ?? 32

    const seedAmount: number = interaction.options.getNumber('seed-amount') ?? 75
    const placementType: boolean = interaction.options.getBoolean('placement-type') ?? false
    const straightChance: number = interaction.options.getNumber('straight-chance') ?? 0.6
    const turnChance: number = interaction.options.getNumber('turn-chance') ?? 0.4
    const branchChance: number = interaction.options.getNumber('branch-chance') ?? 0
    const borderWrapping: boolean = interaction.options.getBoolean('border-wrapping')
    const terminateOnContact: boolean = interaction.options.getBoolean('terminate-on-contact')
    const minLength: number = interaction.options.getNumber('min-length') ?? 0
    const maxLength: number = interaction.options.getNumber('max-length') ?? 50
    const minTurns: number = interaction.options.getNumber('min-turns') ?? 0
    const maxTurns: number = interaction.options.getNumber('max-turns') ?? 50
    const minBranches: number = interaction.options.getNumber('min-branches') ?? 0
    const maxBranches: number = interaction.options.getNumber('max-branches') ?? 0

    const observer = new InteractionObserver(interaction)

    if (interaction.channel.id !== '1227836204087640084' && !observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], interaction.channel)) return await observer.abort(5)

    //if (!observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], interaction.channel)) return await observer.abort(0)
    const algorithm = new RandomWalker()
      .setSeedAmount(seedAmount)
      .setPlacementType(+!placementType)
      .setStraightChance(straightChance)
      .setTurnChance(turnChance)
      .setBranchChance(branchChance)
      .allowBorderWrapping(borderWrapping)
      .terminateOnContact(terminateOnContact)
      .setMinLength(minLength)
      .setMaxLength(maxLength)
      .setMinTurns(minTurns)
      .setMaxTurns(maxTurns)
      .setMinBranches(minBranches)
      .setMaxBranches(maxBranches)
      .setWalkerInstructions([
        ...global.movementOptions.horizontal as Array<number>,
        ...global.movementOptions.vertical as Array<number>,
      ])

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

export default SeedMaze
