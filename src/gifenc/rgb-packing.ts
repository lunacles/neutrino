// Modified from: https://github.com/mattdesl/gifenc/tree/master
// plan on improving later.
const RGBPacker = {
  uint32ToRGBA(color: number): RGBAQuaple {
    let a: number = (color >> 24) & 0xff
    let b: number = (color >> 16) & 0xff
    let g: number = (color >> 8) & 0xff
    let r: number = color & 0xff
    return [r, g, b, a]
  },
  rgbaToUint32(r: RGBValue, g: RGBValue, b: RGBValue, a: RGBValue): number {
    return (a << 24) | (b << 16) | (g << 8) | r
  },
  // reduce each channel from 8 bits to 4 bits (for 24 bit colors)
  rgb24BitTo16Bit(r: RGBValue, g: RGBValue, b: RGBValue): number {
    return ((r << 8) & 0xf800) | ((g << 2) & 0x03e0) | (b >> 3)
  },
  // reduce each channel from 8 bits to 4 bits (for 32 bit colors)
  rgba32BitTo16Bit(r: RGBValue, g: RGBValue, b: RGBValue, a: RGBValue): number {
    return (r >> 4) | (g & 0xf0) | ((b & 0xf0) << 4) | ((a & 0xf0) << 8)
  },
  // reduce a 24bit color to a 16 bit color (bit distribution varies between channels)
  rgb24BitTo12Bit(r: RGBValue, g: RGBValue, b: RGBValue): number {
    return ((r >> 4) << 8) | (g & 0xf0) | (b >> 4)
  }
}

export default RGBPacker
