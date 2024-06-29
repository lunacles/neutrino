// Modified from: https://github.com/mattdesl/gifenc/tree/master
// plan on improving later.
import { GifStreamInterface } from 'types.js'
import GifStream from './stream.js'

const lzwEncode = class {
  private static readonly bits = 12
  private static readonly defaultHashSize = 5003
  private static readonly masks = [
    0x0000, 0x0001, 0x0003, 0x0007,
    0x000f, 0x001f, 0x003f, 0x007f,
    0x00ff, 0x01ff, 0x03ff, 0x07ff,
    0x0fff, 0x1fff, 0x3fff, 0x7fff,
    0xffff,
  ]
  private currentAccumulator: number
  private currentBits: number
  private accumulatorCount: number
  private accum: Uint8Array
  private outStream: GifStreamInterface
  private pixels: Array<number> | Uint8Array
  private colorDepth: number
  private hashTable: Int32Array
  private codeTable: Int32Array
  private numBits: number
  private freeEntry: number
  private clearFlag: boolean
  private maxCode: number
  private initialBits: number
  private endOfFileCode: number
  constructor(
    pixels: Array<number> | Uint8Array,
    colorDepth: number,
    outStream: any = new GifStream(512),
    accum: Uint8Array = new Uint8Array(256),
    hashTable: Int32Array = new Int32Array(lzwEncode.defaultHashSize),
    codeTable: Int32Array = new Int32Array(lzwEncode.defaultHashSize)
  ) {
    this.pixels = pixels
    this.colorDepth = colorDepth
    this.outStream = outStream
    this.accum = accum
    this.hashTable = hashTable
    this.codeTable = codeTable

    this.currentAccumulator = 0
    this.currentBits = 0
    this.accumulatorCount = 0
    this.numBits = 0
    this.freeEntry = 0
    this.clearFlag = false
    this.maxCode = 0
    this.initialBits = 0
    this.endOfFileCode = 0
  }
  public encode(): Uint8Array {
    let hashSize: number = this.hashTable.length
    let initCodeSize: number = Math.max(2, this.colorDepth)

    // Initialize accumulators and tables
    this.accum.fill(0)
    this.codeTable.fill(0)
    this.hashTable.fill(-1)

    let initBits: number = initCodeSize + 1
    this.initialBits = initBits
    this.numBits = this.initialBits
    this.maxCode = (1 << this.numBits) - 1

    let clearCode: number = 1 << (initBits - 1)
    this.endOfFileCode = clearCode + 1
    this.freeEntry = clearCode + 2

    let currentEntry: number = this.pixels[0]

    // Calculate hash shift
    let hashShift: number = 0
    for (let fCode: number = hashSize; fCode < 65536; fCode *= 2)
      hashShift++

    hashShift = 8 - hashShift

    this.outStream.writeByte(initCodeSize)
    this.output(clearCode)

    let length: number = this.pixels.length

    for (let idx: number = 1; idx < length; idx++) {
      loop: {
        let currentPixel: number = this.pixels[idx]
        let fCode: number = (currentPixel << lzwEncode.bits) + currentEntry
        let hashIndex: number = (currentPixel << hashShift) ^ currentEntry
        if (this.hashTable[hashIndex] === fCode) {
          currentEntry = this.codeTable[hashIndex]
          break loop
        }

        let displacement: number = hashIndex === 0 ? 1 : hashSize - hashIndex
        while (this.hashTable[hashIndex] >= 0) {
          hashIndex -= displacement
          if (hashIndex < 0)
            hashIndex += hashSize

          if (this.hashTable[hashIndex] === fCode) {
            currentEntry = this.codeTable[hashIndex]
            break loop
          }
        }
        this.output(currentEntry)
        currentEntry = currentPixel
        if (this.freeEntry < 1 << lzwEncode.bits) {
          this.codeTable[hashIndex] = this.freeEntry++
          this.hashTable[hashIndex] = fCode
        } else {
          this.hashTable.fill(-1)
          this.freeEntry = clearCode + 2
          this.clearFlag = true
          this.output(clearCode)
        }
      }
    }

    this.output(currentEntry)
    this.output(this.endOfFileCode)

    this.outStream.writeByte(0)
    return this.outStream.bytesView()
  }
  private output(code: number): void {
    this.currentAccumulator &= lzwEncode.masks[this.currentBits]

    if (this.currentBits > 0) {
      this.currentAccumulator |= code << this.currentBits
    } else {
      this.currentAccumulator = code
    }

    this.currentBits += this.numBits

    while (this.currentBits >= 8) {
      this.accum[this.accumulatorCount++] = this.currentAccumulator & 0xff
      if (this.accumulatorCount >= 254) {
        this.outStream.writeByte(this.accumulatorCount)
        this.outStream.writeBytesView(this.accum, 0, this.accumulatorCount)
        this.accumulatorCount = 0
      }
      this.currentAccumulator >>= 8
      this.currentBits -= 8
    }

    if (this.freeEntry > this.maxCode || this.clearFlag) {
      if (this.clearFlag) {
        this.numBits = this.initialBits
        this.maxCode = (1 << this.numBits) - 1
        this.clearFlag = false
      } else {
        this.numBits++
        this.maxCode = this.numBits === lzwEncode.bits ? (1 << this.numBits) : (1 << this.numBits) - 1
      }
    }

    if (code === this.endOfFileCode) {
      while (this.currentBits > 0) {
        this.accum[this.accumulatorCount++] = this.currentAccumulator & 0xff
        if (this.accumulatorCount >= 254) {
          this.outStream.writeByte(this.accumulatorCount)
          this.outStream.writeBytesView(this.accum, 0, this.accumulatorCount)
          this.accumulatorCount = 0
        }
        this.currentAccumulator >>= 8
        this.currentBits -= 8
      }
      if (this.accumulatorCount > 0) {
        this.outStream.writeByte(this.accumulatorCount)
        this.outStream.writeBytesView(this.accum, 0, this.accumulatorCount)
        this.accumulatorCount = 0
      }
    }
  }
}

export default lzwEncode
