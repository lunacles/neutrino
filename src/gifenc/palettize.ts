// Modified from: https://github.com/mattdesl/gifenc/tree/master
// plan on improving later.
import { Format } from 'types/enum.js'
import RGBPacker from './rgb-packing.js'
import Color from 'canvas/color.js'

const Palettize = {
  applyPalette(rgba: Uint8ClampedArray, palette: Array<PaletteValue>, format: typeof Format[keyof typeof Format] = Format.RGB565): Uint8Array {
    if (palette.length > 256)
      throw new Error('applyPalette() only works with 256 colors or less')

    let data: Uint32Array = new Uint32Array(rgba.buffer)
    let length: number = data.length
    let binCount: number = format === Format.RGB444 ? 4096 : 65536
    let index: Uint8Array = new Uint8Array(length)
    let cache: Array<number> = new Array(binCount)
    //let hasAlpha: boolean = format === Format.RGBA4444

    // Some duplicate code below due to very hot code path
    // Introducing branching/conditions shows some significant impact
    if (format === Format.RGBA4444) {
      for (let i = 0; i < length; i++) {
        let color: number = data[i]
        let a: RGBValue = (color >> 24) & 0xff
        let b: RGBValue = (color >> 16) & 0xff
        let g: RGBValue = (color >> 8) & 0xff
        let r: RGBValue = color & 0xff
        let key: number = RGBPacker.rgba32BitTo16Bit(r, g, b, a)
        let idx: number
        if (key in cache) {
          idx = cache[key]
        } else {
          idx = this.nearestColorIndexRGBA(r, g, b, a, palette)
          cache[key] = idx
        }

        index[i] = idx
      }
    } else {
      let rgb888ToKey = format === Format.RGB444 ? RGBPacker.rgb24BitTo12Bit : RGBPacker.rgb24BitTo16Bit
      for (let i: number = 0; i < length; i++) {
        let color: number = data[i]
        let b: RGBValue = (color >> 16) & 0xff
        let g: RGBValue = (color >> 8) & 0xff
        let r: RGBValue = color & 0xff
        let key: RGBValue = rgb888ToKey(r, g, b)
        let idx: number
        if (key in cache) {
          idx = cache[key]
        } else {
          idx = this.nearestColorIndexRGB(r, g, b, palette)
          cache[key] = idx
        }
        index[i] = idx
      }
    }

    return index
  },
  nearestColorIndexRGBA(r: RGBValue, g: RGBValue, b: RGBValue, a: RGBValue, palette: Array<PaletteValue>): number {
    let k: number = 0
    let mindist: number = 1e100
    for (let i: number = 0; i < palette.length; i++) {
      let px2: PaletteValue = palette[i]
      let a2: RGBValue = px2[3]
      let curdist: number = ((a2 - a) * (a2 - a))

      if (curdist > mindist) continue
      let r2: RGBValue = px2[0]
      curdist += ((r2 - r) * (r2 - r))

      if (curdist > mindist) continue
      let g2: RGBValue = px2[1]
      curdist += ((g2 - g) * (g2 - g))

      if (curdist > mindist) continue
      let b2: RGBValue = px2[2]
      curdist += ((b2 - b) * (b2 - b))

      if (curdist > mindist) continue
      mindist = curdist
      k = i
    }
    return k
  },
  nearestColorIndexRGB(r: RGBValue, g: RGBValue, b: RGBValue, palette: Array<PaletteValue>): number {
    let k: number = 0
    let mindist: number = 1e100
    for (let i: number = 0; i < palette.length; i++) {
      let px2: PaletteValue = palette[i]
      let r2: RGBValue = px2[0]
      let curdist: number = ((r2 - r) * (r2 - r))

      if (curdist > mindist) continue
      let g2: RGBValue = px2[1]
      curdist += ((g2 - g) * (g2 - g))

      if (curdist > mindist) continue
      let b2: RGBValue = px2[2]
      curdist += ((b2 - b) * (b2 - b))

      if (curdist > mindist) continue
      mindist = curdist
      k = i
    }
    return k
  },
  nearestColorIndex(colors: Array<PaletteValue>, pixel: Array<number>, distanceFn = Color.euclideanDistSqrd): number {
    let minDist: number = Infinity
    let minDistIndex: number = -1
    for (let j: number = 0; j < colors.length; j++) {
      let paletteColor: PaletteValue = colors[j]
      let dist: number = distanceFn(pixel, paletteColor)
      if (dist < minDist) {
        minDist = dist
        minDistIndex = j
      }
    }
    return minDistIndex
  },
  snapColorsToPalette(palette: Array<PaletteValue>, knownColors: Array<PaletteValue>, threshold: number = 5): void {
    if (!palette.length || !knownColors.length) return

    let paletteRGB: Array<RGBTuple> = palette.map((p: PaletteValue): RGBTuple => p.slice(0, 3) as RGBTuple)
    let thresholdSq: number = threshold * threshold
    let dim: number = palette[0].length
    for (let i: number = 0; i < knownColors.length; i++) {
      let color: PaletteValue = knownColors[i]
      if (color.length < dim) {
        // palette is RGBA, known is RGB
        color = [color[0], color[1], color[2], 0xff]
      } else if (color.length > dim) {
        // palette is RGB, known is RGBA
        color = color.slice(0, 3) as RGBTuple
      } else {
        // make sure we always copy known colors
        color = color.slice() as PaletteValue
      }
      let r: Array<number> = this.nearestColorIndexWithDistance(paletteRGB, color.slice(0, 3), Color.euclideanDistSqrd)
      let idx: number = r[0]
      let distanceSq: number = r[1]
      if (distanceSq > 0 && distanceSq <= thresholdSq)
        palette[idx] = color
    }
  },
  nearestColorIndexWithDistance(colors: Array<PaletteValue>, pixel: Array<number>, distanceFn = Color.euclideanDistSqrd): Pair<number> {
    let minDist: number = Infinity
    let minDistIndex: number = -1
    for (let j: number = 0; j < colors.length; j++) {
      let paletteColor: PaletteValue = colors[j]
      let dist: number = distanceFn(pixel, paletteColor)
      if (dist < minDist) {
        minDist = dist
        minDistIndex = j
      }
    }
    return [minDistIndex, minDist]
  },
  nearestColor(colors: Array<PaletteValue>, pixel: Array<number>, distanceFn = Color.euclideanDistSqrd): PaletteValue {
    return colors[this.nearestColorIndex(colors, pixel, distanceFn)]
  }
}

export default Palettize
/*
import RGBPacker from './rgb-packing.js'
import Color from 'canvas/color.js'

interface PreQuantizeOptions {
  roundRGB?: number
  roundAlpha?: number
  oneBitAlpha?: boolean | number
}

const Palettize = {
  roundStep(byte: number, step: number): number {
    return step > 1 ? Math.round(byte / step) * step : byte
  },
  prequantize(rgba: Uint8ClampedArray, {
    roundRGB = 5,
    roundAlpha = 10,
    oneBitAlpha = null
  }: PreQuantizeOptions = {}): void {
    let data: Uint32Array = new Uint32Array(rgba.buffer);
    for (let i: number = 0; i < data.length; i++) {
      let color: number = data[i]
      let a: RGBValue = (color >> 24) & 0xff
      let b: RGBValue = (color >> 16) & 0xff
      let g: RGBValue = (color >> 8) & 0xff
      let r: RGBValue = color & 0xff

      a = this.roundStep(a, roundAlpha)
      if (oneBitAlpha) {
        let threshold: number = typeof oneBitAlpha === 'number' ? oneBitAlpha : 127
        a = a <= threshold ? 0x00 : 0xff
      }
      r = this.roundStep(r, roundRGB)
      g = this.roundStep(g, roundRGB)
      b = this.roundStep(b, roundRGB)

      data[i] = (a << 24) | (b << 16) | (g << 8) | (r << 0)
    }
  },
  applyPalette(rgba: Uint8ClampedArray, palette: Array<PaletteValue>, format: typeof Format[keyof typeof Format] = Format.RGB565): Uint8Array {
    if (!rgba || !rgba.buffer) throw new Error('quantize() expected RGBA Uint8Array data')
    if (!(rgba instanceof Uint8Array) && !(rgba instanceof Uint8ClampedArray)) throw new Error('quantize() expected RGBA Uint8Array data')

    if (palette.length > 256) throw new Error('applyPalette() only works with 256 colors or less')

    let data: Uint32Array = new Uint32Array(rgba.buffer)
    let length: number = data.length
    let binCount: number = format === Format.RGB444 ? 4096 : 65536
    let index: Uint8Array = new Uint8Array(length)
    let cache: Array<number> = new Array(binCount)
    //let hasAlpha: boolean = format === Format.RGBA4444

    // Some duplicate code below due to very hot code path
    // Introducing branching/conditions shows some significant impact
    if (format === "rgba4444") {
      for (let i = 0; i < length; i++) {
        let color: number = data[i];
        let a: RGBValue = (color >> 24) & 0xff
        let b: RGBValue = (color >> 16) & 0xff
        let g: RGBValue = (color >> 8) & 0xff
        let r: RGBValue = color & 0xff
        let key: number = RGBPacker.rgba8888ToRGBA4444(r, g, b, a)
        let idx: number
        if (key in cache) {
          idx = cache[key]
        } else {
          idx = this.nearestColorIndexRGBA(r, g, b, a, palette)
          cache[key] = idx
        }

        index[i] = idx
      }
    } else {
      let rgb888ToKey = format === "rgb444" ? RGBPacker.rgb888ToRGB444 : RGBPacker.rgb888ToRGB565
      for (let i: number = 0; i < length; i++) {
        let color: number = data[i]
        let b: RGBValue = (color >> 16) & 0xff
        let g: RGBValue = (color >> 8) & 0xff
        let r: RGBValue = color & 0xff
        let key: RGBValue = rgb888ToKey(r, g, b)
        let idx: number
        if (key in cache) {
          idx = cache[key]
        } else {
          idx = this.nearestColorIndexRGB(r, g, b, palette)
          cache[key] = idx
        }
        index[i] = idx
      }
    }

    return index
  },
  nearestColorIndexRGBA(r: RGBValue, g: RGBValue, b: RGBValue, a: RGBValue, palette: Array<PaletteValue>): number {
    let k: number = 0
    let mindist: number = 1e100
    for (let i: number = 0; i < palette.length; i++) {
      let px2: PaletteValue = palette[i]
      let a2: RGBValue = px2[3]
      let curdist: number = ((a2 - a) * (a2 - a))

      if (curdist > mindist) continue
      let r2: RGBValue = px2[0]
      curdist += ((r2 - r) * (r2 - r))

      if (curdist > mindist) continue
      let g2: RGBValue = px2[1]
      curdist += ((g2 - g) * (g2 - g))

      if (curdist > mindist) continue
      let b2: RGBValue = px2[2]
      curdist += ((b2 - b) * (b2 - b))

      if (curdist > mindist) continue
      mindist = curdist
      k = i
    }
    return k
  },
  nearestColorIndexRGB(r: RGBValue, g: RGBValue, b: RGBValue, palette: Array<PaletteValue>): number {
    let k: number = 0
    let mindist: number = 1e100
    for (let i: number = 0; i < palette.length; i++) {
      let px2: PaletteValue = palette[i]
      let r2: RGBValue = px2[0]
      let curdist: number = ((r2 - r) * (r2 - r))

      if (curdist > mindist) continue
      let g2: RGBValue = px2[1]
      curdist += ((g2 - g) * (g2 - g))

      if (curdist > mindist) continue
      let b2: RGBValue = px2[2]
      curdist += ((b2 - b) * (b2 - b))

      if (curdist > mindist) continue
      mindist = curdist
      k = i
    }
    return k
  },
  nearestColorIndex(colors: Array<PaletteValue>, pixel: Array<number>, distanceFn = Color.euclideanDistanceSquared): number {
    let minDist: number = Infinity
    let minDistIndex: number = -1
    for (let j: number = 0; j < colors.length; j++) {
      let paletteColor: PaletteValue = colors[j]
      let dist: number = distanceFn(pixel, paletteColor)
      if (dist < minDist) {
        minDist = dist
        minDistIndex = j
      }
    }
    return minDistIndex
  },
  snapColorsToPalette(palette: Array<PaletteValue>, knownColors: Array<PaletteValue>, threshold: number = 5): void {
    if (!palette.length || !knownColors.length) return

    let paletteRGB: Array<RGBTuple> = palette.map((p: PaletteValue): RGBTuple => p.slice(0, 3) as RGBTuple)
    let thresholdSq: number = threshold * threshold
    let dim: number = palette[0].length
    for (let i: number = 0; i < knownColors.length; i++) {
      let color: PaletteValue = knownColors[i]
      if (color.length < dim) {
        // palette is RGBA, known is RGB
        color = [color[0], color[1], color[2], 0xff]
      } else if (color.length > dim) {
        // palette is RGB, known is RGBA
        color = color.slice(0, 3) as RGBTuple
      } else {
        // make sure we always copy known colors
        color = color.slice() as PaletteValue
      }
      let r: Array<number> = this.nearestColorIndexWithDistance(paletteRGB, color.slice(0, 3), Color.euclideanDistanceSquared)
      let idx: number = r[0]
      let distanceSq: number = r[1]
      if (distanceSq > 0 && distanceSq <= thresholdSq)
        palette[idx] = color
    }
  },
  nearestColorIndexWithDistance(colors: Array<PaletteValue>, pixel: Array<number>, distanceFn = Color.euclideanDistanceSquared): Pair<number> {
    let minDist: number = Infinity
    let minDistIndex: number = -1
    for (let j: number = 0; j < colors.length; j++) {
      let paletteColor: PaletteValue = colors[j]
      let dist: number = distanceFn(pixel, paletteColor)
      if (dist < minDist) {
        minDist = dist
        minDistIndex = j
      }
    }
    return [minDistIndex, minDist]
  },
  nearestColor(colors: Array<PaletteValue>, pixel: Array<number>, distanceFn = Color.euclideanDistanceSquared): PaletteValue {
    return colors[this.nearestColorIndex(colors, pixel, distanceFn)]
  }
}

export default Palettize

*/
