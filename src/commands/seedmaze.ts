import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  AttachmentBuilder,
  SlashCommandBooleanOption,
  PermissionsBitField,
  SlashCommandStringOption,
  SlashCommandNumberOption,
} from 'discord.js'
import CommandInterface from './interface.js'
import InteractionObserver from './interactionobserver.js'
import {
  NodeCanvas,
  NodeCanvasInterface,
} from '../canvas/canvas.js'
import {
  Maze
} from '../mazes/maze.js'
import {
  PRNG
} from '../utilities/prng.js'
import {
  Hash
} from '../utilities/hash.js'
import {
  MazeMap
} from '../canvas/elements.js'
import { RandomWalker } from '../mazes/algorithms/randomwalker.js'
import global from '../utilities/global.js'

const SeedMaze: CommandInterface = {
  name: 'seedmaze',
  description: 'Generates a seed maze.',
  data: new SlashCommandBuilder()
    .addStringOption((option: SlashCommandStringOption): SlashCommandStringOption => option
      .setName('seed')
      .setDescription('The maze seed.')
    )
    .addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('dimensions')
      .setDescription('The width and height of the maze. Default is 32.')
      .setMinValue(16)
      .setMaxValue(64)
    )
    .addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('seed-amount')
      .setDescription('The amount of walker seeds. Default is 75.')
      .setMinValue(1)
      .setMaxValue(100)
    )
    .addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('straight-chance')
      .setDescription('The chance for a walker to move forward in the direction it\'s facing. Default its 0.6.')
      .setMinValue(0)
      .setMaxValue(1)
    )
    .addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('turn-chance')
      .setDescription('The chance for a walker to turn to a new direction. Runs if straight chance fails. Default is 0.4.')
      .setMinValue(0)
      .setMaxValue(1)
    )
    .addNumberOption((option: SlashCommandNumberOption): SlashCommandNumberOption => option
      .setName('branch-chance')
      .setDescription('The chance for a walker to branch a new walker. Runs if straight & turn chance fails. Default is 0.')
      .setMinValue(0)
      .setMaxValue(1)
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
    const dimensions: number = interaction.options.getNumber('dimensions') ?? 32
    const seedAmount: number = interaction.options.getNumber('seed-amount') ?? 75
    const straightChance: number = interaction.options.getNumber('straight-chance') ?? 0.6
    const turnChance: number = interaction.options.getNumber('turn-chance') ?? 0.4
    const branchChance: number = interaction.options.getNumber('branch-chance') ?? 0
    const borderWrapping: boolean = interaction.options.getBoolean('border-wrapping')
    const terminateOnContact: boolean = interaction.options.getBoolean('terminate-on-contact')
    const observer = new InteractionObserver(interaction)

    //if (!observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], interaction.channel)) return await observer.abort(0)

    let prngSeed: number = seed === '' ? Math.floor(Math.random() * 2147483646) : /^\d+$/.test(seed) ? parseInt(seed) : Hash.cyrb53(seed)

    let c: NodeCanvasInterface = new NodeCanvas(dimensions * 32, dimensions * 32)
    const maze = new Maze(dimensions, dimensions, PRNG.simple(prngSeed), false)
    const map = new MazeMap(maze)
    maze.runAlgorithm(
      new RandomWalker(seedAmount, true)
        .setWalkerChances(straightChance, turnChance, branchChance)
        .setWalkerInstructions([
          ...global.movementOptions.horizontal as Array<number>,
          ...global.movementOptions.vertical as Array<number>,
        ])
        .setWalkerSettings(borderWrapping, terminateOnContact)
        .setWalkerLimits(Infinity, Infinity, 20)
    ).findPockets().combineWalls()
    map.draw({
      x: 0, y: 0,
      width: dimensions * 32, height: dimensions * 32
    })

    let buffer: Buffer = c.canvas.toBuffer('image/png')
    let attachment = new AttachmentBuilder(buffer, {
      name: 'maze.png'
    })

    await interaction.editReply({
      content: `Here is your maze. (Seed: ${seed ? seed : prngSeed})`,
      files: [attachment],
    })
  },
  test(): boolean {
    return true
  },
}

export default SeedMaze
