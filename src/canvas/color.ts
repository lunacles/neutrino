import * as util from '../utilities/util.js'

const Color = class implements ColorInterface {
  public static fromHex(hex: string): ColorInterface {
    let color: ColorInterface = new Color()
      .setHex(hex)
      .setRGB(Color.hexToRGB(hex))
      .setLAB(Color.hexToLAB(hex))
      .getHSV()
    return color
  }
  public static fromRGB(rgb: RGBTuple, alpha: RGBValue = 255): ColorInterface {
    let color: ColorInterface = new Color()
      .setRGB(rgb, alpha)
      .setHex(Color.rgbToHex(rgb))
      .setLAB(Color.rgbToLAB(rgb))
      .getHSV()
    return color
  }
  public static fromLAB(lab: LABTuple): ColorInterface {
    let color: ColorInterface = new Color()
      .setLAB(lab)
      .setHex(Color.labToHex(lab))
      .setRGB(Color.labToRGB(lab))
      .getHSV()
    return color
  }
  public static hexToRGB(hex: string): RGBTuple {
    if (!/^#([0-9A-Fa-f]{3}){1,2}$/.test(hex as string)) throw new Error('Invalid hex code.')
    hex = hex.toString().replace(/^#/, '')

    if (hex.length === 3)
      hex = hex.split('').map((char: string) => char + char).join('')

    let num: number = parseInt(hex, 16)
    return [(num >> 16) & 0xFF, (num >> 8) & 0xFF, num & 0xFF]
  }
  public static rgbToHex(rgb: RGBTuple): string {
    if (!Array.isArray(rgb) || rgb.length !== 3) throw new Error('Invalid rgb code.')

    return `#${rgb.reduce((a, b): any => (a + (b | 256).toString(16).slice(1)), 0).slice(1)}`
  }
  public static correctGamma(c: number): number {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  public static correctGammaInverse(c: number): number {
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  }
  public static rgbToXYZ(r: RGBValue, g: RGBValue, b: RGBValue, a?: number): Tuple<number> {
    let lr: number = Color.correctGamma(r)
    let lg: number = Color.correctGamma(g)
    let lb: number = Color.correctGamma(b)
    return [
      lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375,
      lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750,
      lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041,
    ]
  }
  public static pivot(t: number): number {
    return t > 0.008856 ? Math.pow(t, 1 / 3) : (7.787 * t) + (16 / 116)
  }
  public static xyzToLAB(x: number, y: number, z: number): LABTuple {
    x /= 0.95047
    y /= 1.00000
    z /= 1.08883
    return [
      116 * Color.pivot(y) - 16,
      500 * (Color.pivot(x) - Color.pivot(y)),
      200 * (Color.pivot(y) - Color.pivot(z)),
    ]
  }
  public static rgbToLAB(rgba: RGBAQuaple | RGBTuple): LABTuple {
    // convert to linear RGB
    let lr = Color.correctGamma(rgba[0] / 255)
    let lg = Color.correctGamma(rgba[1] / 255)
    let lb = Color.correctGamma(rgba[2] / 255)
    let la = rgba[3]

    // convert linear RGB to XYZ
    let [x, y, z]: Tuple<number> = Color.rgbToXYZ(lr, lg, lb)
    // convert XYZ to LAB
    let lab: Tuple<number> = Color.xyzToLAB(x, y, z)
    if (la)
      lab.push(la)

    return lab
  }
  public static labToXYZ(l: LuminosityValue, a: ChromaticValue, b: ChromaticValue): Tuple<number> {
    let fy: number = (l + 16) / 116
    let fx: number = a / 500 + fy
    let fz: number = fy - b / 200
    let xr = fx > 0.206897 ? fx ** 3 : (fx - 16 / 116) / 7.787
    let yr = fy > 0.206897 ? fy ** 3 : (fy - 16 / 116) / 7.787
    let zr = fz > 0.206897 ? fz ** 3 : (fz - 16 / 116) / 7.787
    return [
        xr * 0.95047,
        yr * 1.00000,
        zr * 1.08883
    ]
  }
  public static xyzToRGB(x: number, y: number, z: number): RGBTuple {
    return [
      x * 3.2406 + y * -1.5372 + z * -0.4986,
      x * -0.9689 + y * 1.8758 + z * 0.0415,
      x * 0.0557 + y * -0.2040 + z * 1.0570
    ]
  }
  public static labToRGB(laba: Array<number>): LABTuple {
    let [x, y, z] = Color.labToXYZ(laba[0], laba[1], laba[0])
    let [lr, lg, lb] = Color.xyzToRGB(x, y, z)
    let rgb: Tuple<number> = [
      Math.round(util.clamp(Color.correctGammaInverse(lr), 0, 0xff)),
      Math.round(util.clamp(Color.correctGammaInverse(lg), 0, 0xff)),
      Math.round(util.clamp(Color.correctGammaInverse(lb), 0, 0xff)),
    ]
    if (laba[3])
      rgb.push(laba[3])

    return rgb
  }
  public static labToHex(laba: Array<number>): string {
    if (laba.length === 4)
      laba.pop()

    let rgb: RGBTuple = Color.labToRGB(laba) as RGBTuple
    return Color.rgbToHex(rgb)
  }
  public static hexToLAB(hex: string): LABTuple {
    return Color.rgbToLAB(Color.hexToRGB(hex))
  }
  // calculate euclidean dist^2
  public static euclideanDistSqrd(a: Array<number>, b: Array<number>): number {
    let sum: number = 0
    for (let [i, num] of a.entries()) {
      let dx: number = num - b[i]
      sum += dx * dx
    }
    return sum
  }
  // calculate euclidean dist
  public static euclideanDist(a: Array<number>, b: Array<number>): number {
    return Math.sqrt(Color.euclideanDistSqrd(a, b))
  }
  public static blend(color1: ColorInterface, color2: ColorInterface, weight2: NumberRange<0, 1>): ColorInterface {
    if (weight2 <= 0) return color1
    if (weight2 >= 1) return color2
    let weight1: number = 1 - weight2

    return Color.fromRGB([
      Math.round((color1.red * weight1) + (color2.red * weight2)),
      Math.round((color1.green * weight1) + (color2.green * weight2)),
      Math.round((color1.blue * weight1) + (color2.blue * weight2)),
    ])
  }
  public hex: string

  public rgb: RGBTuple
  public rgba: RGBAQuaple
  public red: RGBValue
  public green: RGBValue
  public blue: RGBValue

  public lab: LABTuple
  public luminosity: LuminosityValue
  public chromaticA: ChromaticValue
  public chromaticB: ChromaticValue

  public hsv: HSVTuple
  public hue: Hue
  public saturation: Saturation
  public value: Value

  public alpha: RGBValue
  constructor() {
    this.hex = '#000000'

    this.red = 0
    this.green = 0
    this.blue = 0

    // lab colorspace
    this.luminosity = 0
    this.chromaticA = 0
    this.chromaticB = 0

    this.hue = 0
    this.saturation = 0
    this.value = 0

    this.alpha = 255
  }
  public setRGB(rgb: RGBTuple, alpha: RGBValue = 255): this {
    this.rgb = rgb
    this.red = rgb[0]
    this.green = rgb[1]
    this.blue = rgb[2]

    this.alpha = alpha
    this.rgba = [...rgb, alpha]
    return this
  }
  public setHex(hex: string): this {
    this.hex = hex
    return this
  }
  public setLAB(lab: LABTuple): this {
    this.lab = lab
    this.luminosity = lab[0]
    this.chromaticA = lab[1]
    this.chromaticB = lab[2]
    return this
  }
  public getHSV(): this {
    let r: number = this.red / 255
    let g: number = this.green / 255
    let b: number = this.blue / 255

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
    return this
  }
  public rotateHue(hue: Hue): this {
    this.hue = util.clamp(this.hue + hue, 0, 100)
    this.applyHsv()
    return this
  }
  public rotateSaturation(saturation: Saturation): this {
    this.saturation = util.clamp(this.saturation + saturation, 0, 100)
    this.applyHsv()
    return this
  }
  public rotateValue(value: Value): this {
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
        this.red = this.value
        this.green = t
        this.blue = p
        break
      case 1:
        this.red = q
        this.green = this.value
        this.blue = p
        break
      case 2:
        this.red = p
        this.green = this.value
        this.blue = t
        break
      case 3:
        this.red = p
        this.green = q
        this.blue = this.value
        break
      case 4:
        this.red = t
        this.green = p
        this.blue = this.value
        break
      case 5:
        this.red = this.value
        this.green = p
        this.blue = q
        break
    }
    this.red = Math.round(this.red * 255)
    this.green = Math.round(this.green * 255)
    this.blue = Math.round(this.blue * 255)

    this.rgb = [this.red, this.blue, this.green]
    this.hex = Color.rgbToHex(this.rgb)
    this.lab = Color.rgbToLAB(this.rgb)
  }
}

export default Color
