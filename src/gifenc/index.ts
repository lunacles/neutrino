// Modified from: https://github.com/mattdesl/gifenc/tree/master
// plan on improving later.
import { GifStreamInterface, PaletteValue } from 'types.d.js'
import GifStream from './stream.js'
import Const from './constants.js'
import lzwEncode from './lzwEncode.js'
import pnnQuant from './pnnquant2.js'
import Palettize from './palettize.js'

interface GifEncoderOptions {
  readonly initialCapacity?: number
  readonly isAutoMode?: boolean
}
interface FrameOptions {
  readonly transparent?: boolean
  readonly transparentIndex?: number
  readonly delay?: number
  readonly palette?: Array<PaletteValue>
  readonly repeat?: number // -1=once, 0=forever, >0=count
  readonly colorDepth?: number
  readonly dispose?: number
  readonly firstFrame?: number
}

const GIFEncoder = class {
  public readonly gifStream: GifStreamInterface
  private readonly isAutoMode: boolean
  public readonly hashTableSize: number
  public accumulator: Uint8Array
  public hashTable: Int32Array
  public codeTable: Int32Array
  public isInit: boolean
  constructor({
    initialCapacity = 4056,
    isAutoMode = true,
  }: GifEncoderOptions = {}) {
    // Stream all encoded data into this buffer
    this.gifStream = new GifStream(initialCapacity)
    this.isAutoMode = isAutoMode

    // Shared array data across all frames
    this.hashTableSize = 5003 // 80% occupancy
    this.accumulator = new Uint8Array(256)
    this.hashTable = new Int32Array(this.hashTableSize)
    this.codeTable = new Int32Array(this.hashTableSize)

    this.isInit = false
  }
  public reset(): void {
    this.gifStream.reset()
    this.isInit = false
  }
  public finish(): void {
    this.gifStream.writeByte(Const.Trailer)
  }
  public bytes(): Uint8Array {
    return this.gifStream.bytes()
  }
  public bytesView(): Uint8Array {
    return this.gifStream.bytesView()
  }
  public get buffer(): ArrayBufferLike {
    return this.gifStream.buffer
  }
  public get stream() {
    return this.gifStream
  }
  public writeFrame(index: Array<number> | Uint8Array, width: number, height: number, {
    transparent = false,
    transparentIndex = 0x00,
    delay = 0,
    palette = null,
    repeat = 0, // -1=once, 0=forever, >0=count
    colorDepth = 8,
    dispose = -1,
    firstFrame,
  }: FrameOptions = {}): void {
    let first: boolean = false
    if (this.isAutoMode) {
      // In 'auto' mode, the first time we write a frame
      // we will write LSD/GCT/EXT
      if (!this.isInit) {
        // have not yet init, we can consider this our first frame
        first = true
        // in 'auto' mode, we also encode a header on first frame
        // this is different than manual mode where you must encode
        // header yoursef (or perhaps not write header altogether)
        this.writeHeader()
        this.isInit = true
      }
    } else {
      // in manual mode, the first frame is determined by the options only
      first = Boolean(firstFrame)
    }

    width = Math.max(0, Math.floor(width))
    height = Math.max(0, Math.floor(height))

    // Write pre-frame details such as repeat count and global palette
    if (first) {
      if (!palette) throw new Error('First frame must include a { palette } option')

        this.encodeLogicalScreenDescriptor(width, height, palette, colorDepth)
      this.encodeColorTable(palette)
      if (repeat >= 0)
        this.encodeNetscapeExt(repeat)
    }

    let delayTime: number = Math.round(delay / 10)
    this.encodeGraphicControlExt(dispose, delayTime, transparent, transparentIndex)

    let useLocalColorTable: boolean = Boolean(palette) && !first
    this.encodeImageDescriptor(width, height, useLocalColorTable ? palette : null)
    if (useLocalColorTable)
      this.encodeColorTable(palette)

    new lzwEncode(index, colorDepth, this.gifStream, this.accumulator, this.hashTable, this.codeTable).encode()
  }
  private writeUTFBytes(text: string): void {
    for (let i: number = 0; i < text.length; i++)
      this.gifStream.writeByte(text.charCodeAt(i))
  }
  private writeHeader(): void {
    this.writeUTFBytes('GIF89a')
  }
  private writeUInt16(short: number): void {
    this.gifStream.writeByte(short & 0xff)
    this.gifStream.writeByte((short >> 8) & 0xff)
  }
  private encodeGraphicControlExt(dispose: number, delay: number, transparent: boolean, transparentIndex: number): void {
    this.gifStream.writeByte(0x21) // extension introducer
    this.gifStream.writeByte(0xf9) // GCE label
    this.gifStream.writeByte(4) // data block size

    if (transparentIndex < 0) {
      transparentIndex = 0x00
      transparent = false
    }

    let isTransparent: number
    let disposalMethod: number
    if (!transparent) {
      isTransparent = 0
      disposalMethod = 0 // dispose = no action
    } else {
      isTransparent = 1
      disposalMethod = 2 // force clear if using transparent color
    }

    if (dispose >= 0)
      disposalMethod = dispose & 7 // user override

    disposalMethod <<= 2

    let userInput: number = 0

    // packed fields
    this.gifStream.writeByte(
      0 | // 1:3 reserved
      disposalMethod | // 4:6 disposal
      userInput | // 7 user input - 0 = none
      isTransparent // 8 transparency flag
    )

    this.writeUInt16(delay) // delay x 1/100 sec
    this.gifStream.writeByte(transparentIndex || 0x00) // transparent color index
    this.gifStream.writeByte(0) // block terminator
  }
  private encodeLogicalScreenDescriptor(width: number, height: number, palette: Array<PaletteValue>, colorDepth: number = 8) {
    let globalColorTableFlag: number = 1
    let sortFlag: number = 0
    let globalColorTableSize: number = this.colorTableSize(palette.length) - 1
    let fields: number =
      (globalColorTableFlag << 7) |
      ((colorDepth - 1) << 4) |
      (sortFlag << 3) |
      globalColorTableSize
    let backgroundColorIndex: number = 0
    let pixelAspectRatio: number = 0
    this.writeUInt16(width)
    this.writeUInt16(height)
    this.gifStream.writeBytes([fields, backgroundColorIndex, pixelAspectRatio])
  }
  private encodeNetscapeExt(repeat: number) {
    this.gifStream.writeByte(0x21) // extension introducer
    this.gifStream.writeByte(0xff) // app extension label
    this.gifStream.writeByte(11) // block size
    this.writeUTFBytes('NETSCAPE2.0') // app id + auth code
    this.gifStream.writeByte(3) // sub-block size
    this.gifStream.writeByte(1) // loop sub-block id
    this.writeUInt16(repeat) // loop count (extra iterations, 0=repeat forever)
    this.gifStream.writeByte(0) // block terminator
  }
  private encodeColorTable(palette: Array<PaletteValue>): void {
    let colorTableLength: number = 1 << this.colorTableSize(palette.length)
    for (let i: number = 0; i < colorTableLength; i++) {
      let color: PaletteValue = [0, 0, 0]
      if (i < palette.length)
        color = palette[i]

      this.gifStream.writeByte(color[0])
      this.gifStream.writeByte(color[1])
      this.gifStream.writeByte(color[2])
    }
  }
  private encodeImageDescriptor(width: number, height: number, localPalette: Array<PaletteValue>): void {
    this.gifStream.writeByte(0x2c) // image separator

    this.writeUInt16(0) // x position
    this.writeUInt16(0) // y position
    this.writeUInt16(width) // image size
    this.writeUInt16(height)

    if (localPalette) {
      let interlace: number = 0
      let sorted: number = 0
      let palSize: number = this.colorTableSize(localPalette.length) - 1
      // local palette
      this.gifStream.writeByte(
        0x80 | // 1 local color table 1=yes
        interlace | // 2 interlace - 0=no
        sorted | // 3 sorted - 0=no
        0 | // 4-5 reserved
        palSize // 6-8 size of color table
      )
    } else {
      // global palette
      this.gifStream.writeByte(0)
    }
  }
  private colorTableSize(length: number): number {
    return Math.max(Math.ceil(Math.log2(length)), 1)
  }
}

export {
  GIFEncoder,
  pnnQuant,
  Palettize,
}

export default GIFEncoder
