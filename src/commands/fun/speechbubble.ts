import {
  ChatInputCommandInteraction,
  CacheType,
  SlashCommandBuilder,
  AttachmentBuilder,
  SlashCommandAttachmentOption,
  SlashCommandBooleanOption,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
  Collection,
  CollectedInteraction,
  Attachment,
} from 'discord.js'
import InteractionObserver from '../interactionobserver.js'
import NodeCanvas from '../../canvas/canvas.js'
import Colors from '../../canvas/palette.js'
import {
  Circle,
  Clip,
  Media,
  Rect,
  Text,
} from '../../canvas/elements.js'
import { GIFEncoder, pnnQuant, Palettize } from '../../gifenc/index.js'

let encodeGif = (c: NodeCanvasInterface): Buffer => {
  const encoder = new GIFEncoder()
  let canvas: ImageData = c.ctx.getImageData(0, 0, c.width, c.height)
  let palette = pnnQuant.quantize(canvas.data, 256)
  let index = Palettize.applyPalette(canvas.data, palette)
  encoder.writeFrame(index, c.width, c.height, {
    palette,
    repeat: -1,
  })
  encoder.finish()
  return Buffer.from(encoder.buffer)
}

let drawBase = async (image: Attachment, depth: number): Promise<NodeCanvasInterface> => {
  let c = new NodeCanvas(image.width, image.height)
  await Media.draw({
    x: 0, y: 0,
    width: image.width, height: image.height,
    dir: image.url
  })
  let radius: number = image.width * 2
  Clip.circle({
    x: radius * 0.25, y: -radius + depth * 0.75,
    radius
  })
  Rect.draw({
    x: 0, y: -radius * 0.5,
    width: radius, height: radius
  }).fill(Colors.pureBlack)
  Clip.end()

  return c
}

const SpeechBubble: CommandInterface = {
  name: 'speech-bubble',
  description: 'Creates a speechbubble.',
  data: new SlashCommandBuilder()
    .addAttachmentOption((option: SlashCommandAttachmentOption): SlashCommandAttachmentOption => option
    .setName('image')
    .setDescription('The image to speech bubble.')
    .setRequired(true)
  ).addBooleanOption((option: SlashCommandBooleanOption): SlashCommandBooleanOption => option
    .setName('flip')
    .setDescription('The side the speechbubble arrow will point from. True = right, false = left.')
    .setRequired(true)
  ).setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const observer = await new InteractionObserver(interaction).defer()
    const image: Attachment = interaction.options.getAttachment('image')
    const side: boolean = interaction.options.getBoolean('flip') ?? false

    try {
      let buttonWidth: number = image.width / 5
      let buttonHeight: number = image.height / 5

      let c: NodeCanvasInterface = await drawBase(image, buttonHeight)

      const buttons: Array<ActionRowBuilder<ButtonBuilder>> = []

      for (let iy: number = 1; iy < 5; iy++) {
        let row = new ActionRowBuilder<ButtonBuilder>()
        for (let ix: number = 0; ix < 5; ix++) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`${ix},${iy}`)
              .setLabel(`${iy * 5 + ix - 4}`)
              .setStyle(ButtonStyle.Secondary)
          )

          let size: number = Math.min(buttonWidth, buttonHeight) * 0.25
          Circle.draw({
            x:  buttonWidth * ix + buttonWidth * 0.5, y: buttonHeight * iy + buttonHeight * 0.5,
            radius: size
          }).both(Colors.white, Colors.black, size * 0.1)
          Text.draw({
            x: buttonWidth * ix + buttonWidth * 0.5, y: buttonHeight * iy + buttonHeight * 0.5 + size * 0.35,
            size: size * 1,
            text: `${iy * 5 + ix - 4}`,
            align: 'center',
            family: 'Ubuntu', style: 'bold',
          }).both(Colors.white, Colors.black, size * 0.1)
        }
        buttons.push(row)
      }
      buttons.push(new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('finish')
          .setLabel('Finish')
          .setStyle(ButtonStyle.Success),
        )
      )

      let buffer: Buffer = c.canvas.toBuffer('image/png')
      let attachment = new AttachmentBuilder(buffer, {
        name: 'speechbubble.png'
      })

      await interaction.editReply({
        content: 'Please select where you want the speechbubble to point',
        files: [attachment],
        components: buttons,
      })

      const collector: Component = interaction.channel.createMessageComponentCollector({
        filter: observer.componentsFilter(buttons.flatMap(action => action.components.flatMap(button => {
          let x: number = (parseInt(button.data.label) % 5) - 1
          let y: number = Math.floor(parseInt(button.data.label) / 5) + 1
          if (isNaN(x) || isNaN(y)) return button.data.label.toLowerCase()
          return `${x},${y}`
        }))),
        time: 15e3,
      })

      let selectedButton: Pair<number>
      collector.on('collect', async (action: Action): Promise<void> => {
        if (action.customId === 'finish') {
          let attachment = new AttachmentBuilder(await encodeGif(c), {
            name: 'speechbubble.gif'
          })

          await action.update({
            content: 'Here is your completed speech bubble:',
            files: [attachment],
            components: []
          })
          return
        }

        let drawArrow = async (x: number, y: number): Promise<AttachmentBuilder> => {
          c = await drawBase(image, buttonHeight)
          let path: Array<Pair<number>> = [[buttonWidth * x + buttonWidth * 0.5, buttonHeight * y + buttonHeight * 0.5]]

          if (side) {
            path.push([image.width - buttonWidth, 0], [image.width, 0], [image.width, buttonHeight])
          } else {
            path.push([buttonWidth, 0], [0, 0], [0, buttonHeight])
          }

          Clip.poly(path)
          Rect.draw({
            x: 0, y: 0,
            width: image.width, height: image.height
          }).fill(Colors.pureBlack)
          Clip.end()

          let buffer: Buffer = c.canvas.toBuffer('image/png')
          let attachment = new AttachmentBuilder(buffer, {
            name: 'speechbubble.png'
          })

          return attachment
        }
        let [sx, sy] = action.customId.split(',')
        let x = parseInt(sx)
        let y = parseInt(sy) - 1

        if (selectedButton)
          buttons[selectedButton[1]].components[selectedButton[0]].setStyle(ButtonStyle.Secondary)

        selectedButton = [x, y]

        buttons[y].components[x].setStyle(ButtonStyle.Primary)
        await action.update({
          files: [await drawArrow(x, y + 1)],
          components: buttons
        })
      })

      collector.on('end', (collected: Collection<string, CollectedInteraction<CacheType>>) => {
        if (collected.size === 0)
          interaction.editReply({
            content: 'No response received, speech bubble timed out.',
            files: [],
            components: [],
          })
      })
    } catch (err) {
      await observer.panic(err, this.name)
    }
  },
  test(): boolean {
    return true
  },
}

export default SpeechBubble
