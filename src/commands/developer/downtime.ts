import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  SlashCommandIntegerOption,
  SlashCommandStringOption,
  SlashCommandChannelOption,
  TextChannel,
  NewsChannel,
  StageChannel,
  VoiceChannel,
  ChannelType,
  ForumChannel,
  AttachmentBuilder,
} from 'discord.js'
import InteractionObserver from '../interactionobserver.js'
import NodeCanvas from '../../canvas/canvas.js'
import {
  Background,
  Circle,
  Line,
  Media,
  Text
} from '../../canvas/elements.js'
import Colors from '../../canvas/palette.js'
import config from '../../config.js'
import Color from '../../canvas/color.js'
import * as util from '../../utilities/util.js'
import { Abort } from '../../types/enum.js'

type Colour = typeof Color | Array<number> | string | object
type LineData = [Tuple<number>, Colour]
type CircleData = [Tuple<number>, Colour, number, boolean]

let drawLines = (offset: number, data: Array<LineData>): void => {
  for (let [[x1, x2, y], color] of data) {
    Line.draw({
      x1: offset + x1, y1: y,
      x2: offset + x2, y2: y,
    }).stroke(color, 8)
  }
}
let drawCircles = (offset: number, data: Array<CircleData>): void => {
  for (let [[x, y, radius], color, lineWidth, fill] of data) {
    let c = Circle.draw({
      x: offset + x, y,
      radius
    }).stroke(color, lineWidth)
    if (fill)
      c.fill(color)
  }
}

const DownTime: CommandInterface = {
  name: 'downtime',
  description: 'Shuts down the bot with an estimated downtime duration.',
  data: new SlashCommandBuilder()
    .addChannelOption((option: SlashCommandChannelOption): SlashCommandChannelOption => option
      .setName('channel')
      .setDescription('The channel to send the downtime notification in.')
      .setRequired(true)
    ).addIntegerOption((option: SlashCommandIntegerOption): SlashCommandIntegerOption => option
      .setName('duration')
      .setDescription('The estimated duration of the downtime in seconds. Default is "Unkown duration".')
    ).addStringOption((option: SlashCommandStringOption): SlashCommandStringOption => option
      .setName('reason')
      .setDescription('The reason behind the downtime. Default is "Unspecified".')
    ).setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = new InteractionObserver(interaction)
    const duration: number = interaction.options.getInteger('duration')
    //const reason: string = interaction.options.getString('reason') ?? 'Unspecified'
    const targetChannel = interaction.options.getChannel('channel')

    if (interaction.user.id !== config.ownerId) {
      await observer.killInteraction(Abort.InsufficientPermissions)
      return
    }
    if (targetChannel.type !== ChannelType.GuildText) {
      await observer.killInteraction(Abort.InvalidChannelType)
      return
    }
    if (
      !targetChannel ||
      !((channel: any): channel is TextChannel | NewsChannel | VoiceChannel | StageChannel | ForumChannel => 'permissionOverwrites' in channel)(targetChannel)
    ) {
      await observer.killInteraction(Abort.ChannelNoPermissionOverwrites)
      return
    }

    await targetChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: false
    })

    const c: NodeCanvasInterface = new NodeCanvas(1024, 512)

    Background.fill(Colors.darkBlue)
    let offset: number = -c.height * 0.1
    await Media.draw({
      x: offset, y: 0,
      width: c.height, height: c.height,
      dir: './src/utilities/assets/neutrino.png',
    })
    drawLines(offset, [
      [[c.height * 0.7, c.height * 1.2, c.height * 0.2], Colors.white],
      [[c.height * 0.82, c.height * 1.1, c.height * 0.32], Colors.white],
      [[c.height * 0.84, c.height * 0.98, c.height * 0.59], Colors.white],
      [[c.height * 1.4, c.height * 1.09, c.height * 0.41], Colors.white],
      [[c.height * 0.98, c.height * 1.09, c.height * 0.53], Colors.white],
      [[c.height * 1.09 + 16 * 2, c.height * 2 + 16 * 2, c.height * 0.53], Colors.white],
      [[c.height * 1.05, c.height * 1.47, c.height * 0.24], Colors.white],
      [[c.height * 0.95, c.height * 1.18, c.height * 0.28], Colors.cyan],
      [[c.height * 0.96, c.height * 1.06, c.height * 0.41], Colors.cyan],
      [[c.height * 1.03, c.height * 1.35, c.height * 0.37], Colors.cyan],
      [[c.height * 0.89, c.height * 1.12, c.height * 0.46], Colors.glacialBlue],
      [[c.height * 0.82, c.height * 1.1, c.height * 0.32], Colors.white],
      [[c.height * 0.65, c.height * 0.97, c.height * 0.16], Colors.white],
      [[c.height * 0.84, c.height * 2, c.height * 0.66], Colors.white],
    ])
    drawCircles(offset, [
      [[c.height * 1.09 + 16, c.height * 0.53, 16], Colors.white, 8, false],
      [[c.height * 1.29, c.height * 0.24, 12], Colors.white, 0, true],
      [[c.height * 0.88, c.height * 0.26, 16], Colors.white, 0, true],
      [[c.height * 1.35 + 12, c.height * 0.37, 8], Colors.white, 0, true],
      [[c.height * 1.47 + 12, c.height * 0.24, 8], Colors.white, 8, false],
    ])


    Text.draw({
      x: c.width - 48, y: 80,
      size: 64,
      text: 'Neutrino',
      align: 'right',
      family: 'Ubuntu', style: 'bold',
    }).both(Colors.white, Colors.black, 4)

    Text.draw({
      x: c.centerX + 64, y: c.centerY,
      size: 40,
      text: 'Down for maintanence',
      align: 'left',
      family: 'Ubuntu', style: 'bold',
    }).both(Colors.white, Colors.black, 4)
    Text.draw({
      x: c.centerX + 64, y: c.centerY + 64,
      size: 20,
      text: `Estimated downtime: ${duration > 0 ? util.formatSeconds(duration, true) : 'Unknown'}`,
      align: 'left',
      family: 'Ubuntu', style: 'bold',
    }).both(Colors.white, Colors.black, 4)

    let buffer: Buffer = c.canvas.toBuffer('image/png')
    let attachment = new AttachmentBuilder(buffer, {
      name: 'downtime.png'
    })

    await interaction.reply({
      content: 'Downtime setup',
      ephemeral: true,
    })
    await targetChannel.send({
      content: '',
      files: [attachment]
    })

    process.exit()
  },
  test(): boolean {
    return true
  },
}

export default DownTime
