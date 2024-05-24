import * as util from '../utilities/util.js'
import {
  ColorValue
} from '../types.d.js'

const Color = class {
  public static hexToRgb(hex: ColorValue): object {
    if (!/^#([0-9A-Fa-f]{3}){1,2}$/.test(hex as string)) throw new Error('Invalid hex code.')
    hex = hex.toString().replace(/^#/, '')
    if (hex.length === 3)
      hex = hex.split('').map((char: string) => char + char).join('')
    let num: number = parseInt(hex, 16)
    return [(num >> 16) & 0xFF, (num >> 8) & 0xFF, num & 0xFF]
  }
  public static rgbToHex(rgb: ColorValue): string {
    if (!Array.isArray(rgb) || rgb.length !== 3) throw new Error('Invalid rgb code.')
    return `#${rgb.reduce((a, b): any => (a + (b | 256).toString(16).slice(1)), 0).slice(1)}`
  }
  public static blend(color1: ColorValue, color2: ColorValue, weight2: number): object {
    let c1 = color1 instanceof Color ? color1 : new Color(color1)
    let c2 = color2 instanceof Color ? color2 : new Color(color2)

    if (weight2 <= 0) return c1
    if (weight2 >= 1) return c2
    let weight1: number = 1 - weight2

    return new Color([
      Math.round((c1.r * weight1) + (c2.r * weight2)),
      Math.round((c1.g * weight1) + (c2.g * weight2)),
      Math.round((c1.b * weight1) + (c2.b * weight2)),
    ])
  }
  public color: any
  private type: string

  public hex: string
  public rgb: object
  public r: number
  public g: number
  public b: number

  private hue: number
  private saturation: number
  private value: number
  constructor(color: ColorValue) {
    this.color = color

    this.type = typeof this.color === 'string' ? 'hex' : 'rgb'
    this.validate()

    this.hex = this.type === 'hex' ? this.color : Color.rgbToHex(this.color)
    this.rgb = this.type === 'rgb' ? this.color : Color.hexToRgb(this.color)
    this.r = this.rgb[0]
    this.g = this.rgb[1]
    this.b = this.rgb[2]

    this.hue = 0
    this.saturation = 0
    this.value = 0
    this.getHsv()
  }
  private validate(): void {
    if (this.type === 'hex' && !/^#([0-9A-Fa-f]{3}){1,2}$/.test(this.color)) throw new Error('Invalid hex code.')
    if (this.type === 'rgb' && (!Array.isArray(this.color) || this.color.length !== 3)) throw new Error('Invalid rgb code.')
  }
  private getHsv(): void {
    let r: number = this.r / 255
    let g: number = this.g / 255
    let b: number = this.b / 255

    let max: number = Math.max(r, g, b)
    let min: number = Math.min(r, g, b)
    let d: number = max - min

    this.hue = (max === min ? max : ((): number => {
      let h: number = this.hue
      switch (max) {
        case r:
          this.hue = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          this.hue = (b - r) / d + 2
          break
        case b:
          this.hue = (r - g) / d + 4
          break
      }
      return h / 6
    })) as number * 100
    this.saturation = (max === 0 ? 0 : d / max) * 100
    this.value = max * 100
  }
  public rotateHue(hue: number): this {
    this.hue = util.clamp(this.hue + hue, 0, 100)
    this.applyHsv()
    return this
  }
  public rotateSaturation(saturation: number): this {
    this.saturation = util.clamp(this.saturation + saturation, 0, 100)
    this.applyHsv()
    return this
  }
  public rotateValue(value: number): this {
    this.value = util.clamp(this.value + value, 0, 100)
    this.applyHsv()
    return this
  }
  private applyHsv(): void {
    let i: number = Math.floor(this.hue / 60)
    let f: number = this.hue / 60 - i
    let p: number = this.value * (1 - this.saturation)
    let q: number = this.value * (1 - f * this.saturation)
    let t: number = this.value * (1 - (1 - f) * this.saturation)
    switch (i % 6) {
      case 0:
        this.r = this.value
        this.g = t
        this.b = p
        break
      case 1:
        this.r = q
        this.g = this.value
        this.b = p
        break
      case 2:
        this.r = p
        this.g = this.value
        this.b = t
        break
      case 3:
        this.r = p
        this.g = q
        this.b = this.value
        break
      case 4:
        this.r = t
        this.g = p
        this.b = this.value
        break
      case 5:
        this.r = this.value
        this.g = p
        this.b = q
        break
    }
    this.r = Math.round(this.r * 255)
    this.g = Math.round(this.g * 255)
    this.b = Math.round(this.b * 255)

    this.rgb = [this.r, this.b, this.g]
    this.hex = Color.rgbToHex(this.color)
  }
}

export default Color
