import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  AttachmentBuilder,
  PermissionsBitField,
} from 'discord.js'
import NodeCanvas from '../../canvas/canvas.js'
import Colors from '../../canvas/palette.js'
import {
  Background,
  Circle,
  Line,
  Poly,
  Rect,
} from '../../canvas/elements.js'
import Color from '../../canvas/color.js'
import InteractionObserver from '../interactionobserver.js'
import config from '../../config.js'
import { Abort } from '../../types/enum.js'

const Snowman: CommandInterface = {
  name: 'snowman',
  description: 'Sends a snowman.',
  data: new SlashCommandBuilder().setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()

    if (interaction.channel.id !== config.commandChannels.misc && !observer.checkPermissions([PermissionsBitField.Flags.ManageMessages], interaction.channel))
      return await observer.abort(Abort.CommandRestrictedChannel)

    let size: number = 256
    let radii: number = size * 0.5
    let c: NodeCanvasInterface = new NodeCanvas(size, size)

    Background.fill(Colors.glacialBlue)

    // arms
    let path = (path: Pair<number>) => ((to: Pair<number>): void => {
      let [x1, y1] = path
      let [xTo, yTo] = to
      Line.draw({
        x1, y1,
        x2: x1 + xTo, y2: y1 + yTo
      }).stroke(Colors.brown, 4)
      path[0] += xTo,
      path[1] += yTo
    })
    let armLeft = path([size * 0.5 - radii * 0.2, size * 0.5])
    armLeft([-12, 4])
    armLeft([-8, -5])
    armLeft([-6, 3])

    let armRight = path([size * 0.5 + radii * 0.2, size * 0.5])
    armRight([14, -6])
    armRight([6, 3])
    armRight([3, 5])
    armRight([-3, -5])
    armRight([7, -3])

    // Body
    let y: number = size - radii * 0.3 * 2
    Circle.draw({
      x: size * 0.5, y,
      radius: radii * 0.3
    }).both(Colors.snow, Color.blend(Colors.snow, Colors.black, 0.6), 4)
    y -= radii * 0.2 * 2
    Circle.draw({
      x: size * 0.5, y,
      radius: radii * 0.2
    }).both(Colors.snow, Color.blend(Colors.snow, Colors.black, 0.6), 4)
    y -= radii * 0.15 * 2
    Circle.draw({
      x: size * 0.5, y,
      radius: radii * 0.15
    }).both(Colors.snow, Color.blend(Colors.snow, Colors.black, 0.6), 4)

    // Buttons
    y = size - radii * 0.9
    Circle.draw({
      x: size * 0.5, y,
      radius: radii * 0.025
    }).both(Colors.darkGray, Color.blend(Colors.darkGray, Colors.black, 0.6), 4)
    y -= radii * 0.025 * 2 + 5
    Circle.draw({
      x: size * 0.5, y,
      radius: radii * 0.025
    }).both(Colors.darkGray, Color.blend(Colors.darkGray, Colors.black, 0.6), 4)
    y -= radii * 0.025 * 2 + 5
    Circle.draw({
      x: size * 0.5, y,
      radius: radii * 0.025
    }).both(Colors.darkGray, Color.blend(Colors.darkGray, Colors.black, 0.6), 4)

    // Nose
    Poly.draw([
      [size * 0.5 - 4, size * 0.375],
      [size * 0.5 + 4, size * 0.375],
      [size * 0.5, size * 0.375 + 8],
      [size * 0.5 - 4, size * 0.375],
    ]).both(Colors.carrot, Color.blend(Colors.carrot, Colors.black, 0.6), 4)

    // Hat
    Line.draw({
      x1: size * 0.425, y1: size * 0.3,
      x2: size * 0.575, y2: size * 0.3,
    }).both(Colors.black, Color.blend(Colors.black, Colors.pureBlack, 0.6), 4)
    Rect.draw({
      x: size * 0.45, y: size * 0.2,
      width: size * 0.1, height: size * 0.1
    }).both(Colors.black, Color.blend(Colors.black, Colors.pureBlack, 0.6), 4)

    // eyes
    Circle.draw({
      x: size * 0.5 - 8, y: size * 0.35,
      radius: radii * 0.025
    }).both(Colors.darkGray, Color.blend(Colors.darkGray, Colors.black, 0.6), 4)
    Circle.draw({
      x: size * 0.5 + 8, y: size * 0.35,
      radius: radii * 0.025
    }).both(Colors.darkGray, Color.blend(Colors.darkGray, Colors.black, 0.6), 4)

    let buffer: Buffer = c.canvas.toBuffer('image/png')
    let attachment = new AttachmentBuilder(buffer, {
      name: 'snowman.png'
    })

    await interaction.editReply({
      content: 'Here\'s a snowman.',
      files: [attachment],
    })
  },
  test(): boolean {
    return true
  },
}

export default Snowman
