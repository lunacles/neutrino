// Modified from:
// https://github.com/mcychan/PnnQuant.js/blob/master/src/pnnquant.js

/* Fast pairwise nearest neighbor based algorithm for multilevel thresholding
Copyright (C) 2004-2019 Mark Tyler and Dmitry Groshev
Copyright (c) 2018-2021 Miller Cy Chan
* error measure; time used is proportional to number of bins squared - WJ */

import { Format } from 'types/enum.d.js'
import * as util from 'utilities/util.js'

interface Bin {
  ac: number
  rc: number
  gc: number
  bc: number
  cnt: number
  nn: number
  fw: number
  bk: number
  tm: number
  mtm: number
  err: number
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
    let nn: number = 0
    let err: number = 1e100

    let bin1: Bin = bins[idx]
    let n1: number = bin1.cnt
    let wa: number = bin1.ac
    let wr: number = bin1.rc
    let wg: number = bin1.gc
    let wb: number = bin1.bc
    for (let i: number = bin1.fw; i != 0; i = bins[i].fw) {
      let bin: Bin = bins[i]
      let n2: number = bin.cnt
      let nerr2: number = (n1 * n2) / (n1 + n2)
      if (nerr2 >= err) continue

      let nerr: number = 0
      if (hasAlpha) {
        nerr += nerr2 * ((bin.ac - wa) * (bin.ac - wa))
        if (nerr >= err) continue
      }

      nerr += nerr2 * ((bin.rc - wr) * (bin.rc - wr))
      if (nerr >= err) continue

      nerr += nerr2 * ((bin.gc - wg) * (bin.gc - wg))
      if (nerr >= err) continue

      nerr += nerr2 * ((bin.bc - wb) * (bin.bc - wb))
      if (nerr >= err) continue
      err = nerr
      nn = i
    }
    bin1.err = err
    bin1.nn = nn
  },
  binAddRGB(bin: Bin, r: RGBValue, g: RGBValue, b: RGBValue): void {
    bin.rc += r
    bin.gc += g
    bin.bc += b
    bin.cnt++
  },
  createBin(): Bin {
    return {
      ac: 0,
      rc: 0,
      gc: 0,
      bc: 0,
      cnt: 0,
      nn: 0,
      fw: 0,
      bk: 0,
      tm: 0,
      mtm: 0,
      err: 0,
    }
  },
  createBinList(data: Uint32Array, format: typeof Format[keyof typeof Format]): Array<Bin> {
    let bins: Array<Bin> = new Array(format === Format.RGB444 ? 4096 : 65536)
    let size: number = data.length

    /* Build histogram */
    // Note: Instead of introducing branching/conditions
    // within a very hot per-pixel iteration, we just duplicate the code
    // for each new condition
    for (let i: number = 0; i < size; i++) {
      let color: number = data[i]
      let a: RGBValue = (color >> 24) & 0xff
      let b: RGBValue = (color >> 16) & 0xff
      let g: RGBValue = (color >> 8) & 0xff
      let r: RGBValue = color & 0xff
      let index: number
      switch (format) {
        case Format.RGB444:
          // reduce a 24bit color to a 16 bit color (bit distribution varies between channels)
          index = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
          break
        case Format.RGBA4444:
          // reduce each channel from 8 bits to 4 bits (for 32 bit colors)
          index = ((r >> 4) << 12) | ((g >> 4) << 8) | ((b >> 4) << 4) | (a >> 4)
          break
        case Format.RGB565:
          // reduce each channel from 8 bits to 4 bits (for 24 bit colors)
          index = ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3)
          break
        default:
          throw new Error('Unsupported format')
      }
      let bin: Bin
      if (index in bins) {
        bin = bins[index]
      } else {
        bin = this.createBin()
        bins[index] = bin
      }

      bin.rc += r
      bin.gc += g
      bin.bc += b
      bin.ac += a
      bin.cnt++
    }
    return bins
  },
  quantize(rgba: Uint8ClampedArray | Uint8Array, maxColors: number, {
    format = Format.RGB565,
    clearAlpha = true,
    clearAlphaColor = 0x00,
    clearAlphaThreshold = 0,
    oneBitAlpha = false,
    useSqrt
  }: QuantizeOptions = {}): Array<RGBAQuaple | RGBTuple> {
    if (!rgba || !rgba.buffer) throw new Error('quantize() expected RGBA Uint8Array data')
    if (!(rgba instanceof Uint8Array) && !(rgba instanceof Uint8ClampedArray)) throw new Error('quantize() expected RGBA Uint8Array data')

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

    /* Cluster nonempty bins at one end of array */
    let maxBins: number = 0
    for (let i: number = 0; i < binCount; i++) {
      let bin: Bin = bins[i]
      if (bin != null) {
        let d: number = 1.0 / bin.cnt
        if (hasAlpha) bin.ac *= d
        bin.rc *= d
        bin.gc *= d
        bin.bc *= d
        bins[maxBins++] = bin
      }
    }

    if (maxColors * maxColors / maxBins < 0.022)
      useSqrt = false

    let i: number = 0
    for (i = 0; i < maxBins - 1; i++) {
      bins[i].fw = i + 1
      bins[i + 1].bk = i
      if (useSqrt)
        bins[i].cnt = Math.sqrt(bins[i].cnt)
    }
    if (useSqrt)
      bins[i].cnt = Math.sqrt(bins[i].cnt)

    let h: number
    let l: number
    let l2: number
    /* Initialize nearest neighbors and build heap of them */
    for (i = 0; i < maxBins; i++) {
      this.findNN(bins, i, false)
      /* Push slot on heap */
      let err: number = bins[i].err
      for (l = heap[0]++; l > 1; l = l2) {
        l2 = l >> 1
        if (bins[(h = heap[l2])].err <= err) break
        heap[l] = h
      }
      heap[l] = i
    }

    // Merge bins which increase error the least
    let extBins: number = maxBins - maxColors
    for (i = 0; i < extBins; ) {
      let tb: Bin
      // Use heap to find which bins to merge
      while (true) {
        let b1: number = heap[1]
        tb = bins[b1] // One with least error
        // Is stored error up to date?
        if (tb.tm >= tb.mtm && bins[tb.nn].mtm <= tb.tm) break
        if (tb.mtm == binCountMinusOne) {
          b1 = heap[1] = heap[heap[0]--] // Deleted node
        } else { // Too old error value
          this.findNN(bins, b1, false)
          tb.tm = i
        }
        // Push slot down
        let err = bins[b1].err
        for (l = 1; (l2 = l + l) <= heap[0]; l = l2) {
          if (l2 < heap[0] && bins[heap[l2]].err > bins[heap[l2 + 1]].err)
            l2++
          if (err <= bins[(h = heap[l2])].err) break
          heap[l] = h
        }
        heap[l] = b1
      }

      // Do a merge
      let nb: Bin = bins[tb.nn]
      let n1: number = tb.cnt
      let n2: number = nb.cnt
      let d: number = 1.0 / (n1 + n2)
      if (hasAlpha)
        tb.ac = d * (n1 * tb.ac + n2 * nb.ac)

      tb.rc = d * (n1 * tb.rc + n2 * nb.rc)
      tb.gc = d * (n1 * tb.gc + n2 * nb.gc)
      tb.bc = d * (n1 * tb.bc + n2 * nb.bc)
      tb.cnt += nb.cnt
      tb.mtm = i++

      // Unchain deleted bin
      bins[nb.bk].fw = nb.fw
      bins[nb.fw].bk = nb.bk
      nb.mtm = binCountMinusOne;
    }

    // let palette = new Uint32Array(maxColors);
    let palette = []

    // Fill palette
    let k: number = 0
    for (i = 0; ; k++) {
      let r: RGBValue = util.clamp(Math.round(bins[i].rc), 0, 0xff)
      let g: RGBValue = util.clamp(Math.round(bins[i].gc), 0, 0xff)
      let b: RGBValue = util.clamp(Math.round(bins[i].bc), 0, 0xff)

      let a: number = 0xff
      if (hasAlpha) {
        a = util.clamp(Math.round(bins[i].ac), 0, 0xff)
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

      if ((i = bins[i].fw) == 0) break
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
