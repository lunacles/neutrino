// Modified from: https://github.com/mattdesl/gifenc/tree/master
// plan on improving later.

import RGBPacker from './rgb-packing.js'
import * as util from '../utilities/util.js'
import { RGBTuple, RGBValue, RGBAQuaple, Format, } from 'types.d.js'

interface Bin {
  alphaChannel: number
  redChannel: number
  greenChannel: number
  blueChannel: number
  count: number
  nearestNeighbor: number
  forward: number
  backward: number
  timestamp: number
  maxTimestamp: number
  error: number
}

interface QuantizeOptions {
  format?: typeof Format[keyof typeof Format]
  clearAlpha?: boolean
  clearAlphaColor?: number
  clearAlphaThreshold?: number
  oneBitAlpha?: boolean | number
  readonly useSqrt?: boolean
}

const pnnQuant = {
  findNN(bins: Array<Bin>, idx: number, hasAlpha: boolean): void {
    let nearestNeighborIndex: number = 0
    let minError: number = 1e100

    let currentBin: Bin = bins[idx]
    let currentCount: number = currentBin.count
    let currentAlpha: number = currentBin.alphaChannel
    let currentRed: number = currentBin.redChannel
    let currentGreen: number = currentBin.greenChannel
    let currentBlue: number = currentBin.blueChannel

    for (let i: number = currentBin.forward; i != 0; i = bins[i].forward) {
      let candidateBin: Bin = bins[i]
      let candidateCount: number = candidateBin.count
      let errorTerm: number = (currentCount * candidateCount) / (currentCount + candidateCount)
      if (errorTerm >= minError) continue

      let candidateError: number = 0
      if (hasAlpha) {
        candidateError += errorTerm * Math.pow(candidateBin.alphaChannel - currentAlpha, 2)
        if (candidateError >= minError) continue
      }

      candidateError += errorTerm * Math.pow(candidateBin.redChannel - currentRed, 2)
      if (candidateError >= minError) continue

      candidateError += errorTerm * Math.pow(candidateBin.greenChannel - currentGreen, 2)
      if (candidateError >= minError) continue

      candidateError += errorTerm * Math.pow(candidateBin.blueChannel - currentBlue, 2)
      if (candidateError >= minError) continue

      minError = candidateError
      nearestNeighborIndex = i
    }
    currentBin.error = minError
    currentBin.nearestNeighbor = nearestNeighborIndex
  },
  binAddRGB(bin: Bin, r: RGBValue, g: RGBValue, b: RGBValue): void {
    bin.redChannel += r
    bin.greenChannel += g
    bin.blueChannel += b
    bin.count++
  },
  createBin(): Bin {
    return {
      alphaChannel: 0,
      redChannel: 0,
      greenChannel: 0,
      blueChannel: 0,
      count: 0,
      nearestNeighbor: 0,
      forward: 0,
      backward: 0,
      timestamp: 0,
      maxTimestamp: 0,
      error: 0,
    }
  },
  createBinList(data: Uint32Array, format: typeof Format[keyof typeof Format]): Array<Bin> {
    let bins: Array<Bin> = new Array(format === Format.RGB444 ? 4096 : 65536)

    /* Build histogram */
    // Note: Instead of introducing branching/conditions
    // within a very hot per-pixel iteration, we just duplicate the code
    // for each new condition
    for (let i: number = 0; i < data.length; i++) {
      let color: number = data[i]
      let a: RGBValue = (color >> 24) & 0xff
      let b: RGBValue = (color >> 16) & 0xff
      let g: RGBValue = (color >> 8) & 0xff
      let r: RGBValue = color & 0xff

      // reduce to rgb4444 16-bit uint
      let index: number = {
        'rgb444': RGBPacker.rgb888ToRGB444(r, g, b),
        'rgba4444': RGBPacker.rgba8888ToRGBA4444(r, g, b, a),
        'rgb565': RGBPacker.rgb888ToRGB565(r, g, b),
      }[format]

      let bin: Bin
      if (index in bins) {
        bin = bins[index]
      } else {
        bin = this.createBin()
        bins[index] = bin
      }
      bin.redChannel += r
      bin.greenChannel += g
      bin.blueChannel += b
      if (format === Format.RGBA4444)
        bin.alphaChannel += a
      bin.count++
    }
    return bins
  },
  quantize(imageData: ImageData, maxColors: number, {
    format = Format.RGB565,
    clearAlpha = true,
    clearAlphaColor = 0x00,
    clearAlphaThreshold = 0,
    oneBitAlpha = false,
    useSqrt
  }: QuantizeOptions = {}): Array<RGBAQuaple | RGBTuple> {
    let rgba: Uint8ClampedArray | Uint8Array = imageData.data
    if (!rgba || !rgba.buffer || !(rgba instanceof Uint8Array) && !(rgba instanceof Uint8ClampedArray))
      throw new Error('quantize() expected RGBA Uint8Array data')

    let data: Uint32Array = new Uint32Array(rgba.buffer)

    // format can be:
    // rgb565 (default)
    // rgb444
    // rgba4444

    let hasAlpha: boolean = format === Format.RGBA4444
    let bins: Array<Bin> = this.createBinList(data, format)
    let binCount: number = bins.length
    let binCountMinusOne: number = binCount - 1
    let heap: Uint32Array = new Uint32Array(binCount + 1)

    // Cluster nonempty bins at one end of array
    let maxBins: number = 0
    for (let bin of bins) {
      if (!bin) continue
      let d: number = 1.0 / bin.count
      bin.redChannel *= d
      bin.greenChannel *= d
      bin.blueChannel *= d
      bins[maxBins++] = bin
    }

    if (maxColors * maxColors / maxBins < 0.022)
      useSqrt = false

    let i: number = 0
    for (i = 0; i < maxBins - 1; i++) {
      bins[i].forward = i + 1
      bins[i + 1].backward = i
      if (useSqrt)
        bins[i].count = Math.sqrt(bins[i].count)
    }
    if (useSqrt)
      bins[i].count = Math.sqrt(bins[i].count)

    let heapIndex: number
    let currentHeapIndex: number
    let nextHeapIndex: number
    // Initialize nearest neighbors and build heap of them
    for (i = 0; i < maxBins; i++) {
      this.findNN(bins, i, false)
      // Push slot on heap
      let err: number = bins[i].error
      for (currentHeapIndex = heap[0]++; currentHeapIndex > 1; currentHeapIndex = nextHeapIndex) {
        nextHeapIndex = currentHeapIndex >> 1
        if (bins[(heapIndex = heap[nextHeapIndex])].error <= err) break
        heap[currentHeapIndex] = heapIndex
      }
      heap[currentHeapIndex] = i
    }

    // Merge bins which increase error the least
    let extBins: number = maxBins - maxColors
    for (i = 0; i < extBins;) {
      let tb: Bin
      // Use heap to find which bins to merge
      while (true) {
        let b1: number = heap[1]
        tb = bins[b1] // One with least error
        // Is stored error up to date?
        if (tb.timestamp >= tb.maxTimestamp && bins[tb.nearestNeighbor].maxTimestamp <= tb.timestamp) break
        if (tb.maxTimestamp == binCountMinusOne) {
          b1 = heap[1] = heap[heap[0]--] // Deleted node
        } else { // Too old error value
          this.findNN(bins, b1, false)
          tb.timestamp = i
        }
        // Push slot down
        let err = bins[b1].error
        for (currentHeapIndex = 1; (nextHeapIndex = currentHeapIndex + currentHeapIndex) <= heap[0]; currentHeapIndex = nextHeapIndex) {
          if (nextHeapIndex < heap[0] && bins[heap[nextHeapIndex]].error > bins[heap[nextHeapIndex + 1]].error)
            nextHeapIndex++
          if (err <= bins[(heapIndex = heap[nextHeapIndex])].error) break
          heap[currentHeapIndex] = heapIndex
        }
        heap[currentHeapIndex] = b1
      }

      // Do a merge
      let nb: Bin = bins[tb.nearestNeighbor]
      let n1: number = tb.count
      let n2: number = nb.count
      let d: number = 1.0 / (n1 + n2)
      if (hasAlpha)
        tb.alphaChannel = d * (n1 * tb.alphaChannel + n2 * nb.alphaChannel)

      tb.redChannel = d * (n1 * tb.redChannel + n2 * nb.redChannel)
      tb.greenChannel = d * (n1 * tb.greenChannel + n2 * nb.greenChannel)
      tb.blueChannel = d * (n1 * tb.blueChannel + n2 * nb.blueChannel)
      tb.count += nb.count
      tb.maxTimestamp = i++

      // Unchain deleted bin
      bins[nb.backward].forward = nb.forward
      bins[nb.forward].backward = nb.backward
      nb.maxTimestamp = binCountMinusOne
    }

    // let palette = new Uint32Array(maxColors)
    let palette = []

    // Fill palette
    let k: number = 0
    for (i = 0; ; k++) {
      let r: RGBValue = util.clamp(Math.round(bins[i].redChannel), 0, 0xff)
      let g: RGBValue = util.clamp(Math.round(bins[i].greenChannel), 0, 0xff)
      let b: RGBValue = util.clamp(Math.round(bins[i].blueChannel), 0, 0xff)

      let a: number = 0xff
      if (hasAlpha) {
        a = util.clamp(Math.round(bins[i].alphaChannel), 0, 0xff)
        if (oneBitAlpha) {
          let threshold: number = typeof oneBitAlpha === 'number' ? oneBitAlpha : 127
          a = a <= threshold ? 0x00 : 0xff
        }
        if (clearAlpha && a <= clearAlphaThreshold) {
          r = g = b = clearAlphaColor
          a = 0x00
        }
      }

      let color: RGBAQuaple | RGBTuple = hasAlpha ? [r, g, b, a] : [r, g, b]
      let exists = this.existsInPalette(palette, color)
      if (!exists)
        palette.push(color)

      if ((i = bins[i].forward) == 0) break
    }
    return palette

  },
  existsInPalette(palette: Array<RGBAQuaple | RGBTuple>, color: RGBAQuaple | RGBTuple): boolean {
    for (let i: number = 0; i < palette.length; i++) {
      let p: RGBAQuaple | RGBTuple = palette[i]
      let matchesRGB: boolean = p[0] === color[0] && p[1] === color[1] && p[2] === color[2]
      let matchesAlpha: boolean = p.length >= 4 && color.length >= 4 ? p[3] === color[3] : true
      if (matchesRGB && matchesAlpha) return true
    }
    return false
  },
}

export default pnnQuant
