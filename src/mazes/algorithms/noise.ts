import ImprovedNoise from '../perlinnoise.js'

enum DefaultSettings {
  Zoom = 1,
  Threshold = 0.1,
  Min = -0.3,
  Max = 0.3,
  Iterations = 1,
  Power = 5,
  Size = 16,
  X = 5,
  Y = 5,
  Amplitude = 1,
  Frequency = 1,
  AmplitudeMultiplier = 0.5,
  FrequencyMultiplier = 2,
  Warp = 50,
}

export const Noise = class NoiseInterface {
  maze: MazeInterface
  ran: RandomInterface
  perlin: ImprovedNoiseInterface
  type: NoiseAlgorithms

  private zoom: number
  private threshold: number
  private min: number
  private max: number
  private turbulence: Turbulence
  private repetition: Coordinate
  private amplitude: number
  private frequency: number
  private amplitudeMultiplier: number
  private frequencyMultiplier: number
  private warp: number
  constructor() {
    this.maze = null
    this.ran = null
    this.type = 'normal'

    this.zoom = DefaultSettings.Zoom
    this.threshold = DefaultSettings.Threshold
    this.min = DefaultSettings.Min
    this.max = DefaultSettings.Max
    this.turbulence = {
      power: DefaultSettings.Power,
      size: DefaultSettings.Size
    }
    this.repetition = {
      x: DefaultSettings.X,
      y: DefaultSettings.Y,
    }
    this.amplitude = DefaultSettings.Amplitude
    this.frequency = DefaultSettings.Frequency
    this.amplitudeMultiplier = DefaultSettings.AmplitudeMultiplier
    this.frequencyMultiplier = DefaultSettings.FrequencyMultiplier
    this.warp = DefaultSettings.Warp
  }
  public init(): void {
    this.perlin = new ImprovedNoise(this.ran)

    this[this.type]()
  }
  private validateCell(position: Coordinate): boolean {
    if (!this.maze.has(position.x, position.y)) return false
    return true
  }
  public setThreshold(threshold: number): this {
    this.threshold = threshold
    return this
  }
  public setZoom(zoom: number): this {
    this.zoom = zoom
    return this
  }
  public setClamp(min: number, max: number): this {
    this.min = min
    this.max = max
    return this
  }
  public setType(type: NoiseAlgorithms): this {
    this.type = type
    return this
  }
  private mapBy(map: Function): void {
    for (let y: number = 0; y < this.maze.height; y++) {
      for (let x: number = 0; x < this.maze.width; x++) {
        if (!this.validateCell({ x, y })) continue

        let value: any
        value = map(x, y)

        this.maze.set(x, y, +value)
      }
    }
  }
  public normal(): this {
    this.mapBy((x: number, y: number): boolean => {
      return this.perlin.noise(x / this.zoom, y / this.zoom, 0) > 0
    })
    return this
  }
  public clamped(): this {
    this.mapBy((x: number, y: number): boolean => {
      let noise: number = this.perlin.noise(x / this.zoom, y / this.zoom, 0)
      return noise < this.max && noise > this.min
    })
    return this
  }
  public quantized(): this {
    this.mapBy((x: number, y: number): number => {
      let noise: number = this.perlin.noise(x / this.zoom, y / this.zoom, 0)
      return this.perlin.quantize(noise, this.threshold)
    })
    return this
  }
  public setWarp(warp: number): this {
    this.warp = warp
    return this
  }
  public domainWarped(): this {
    this.mapBy((x: number, y: number): boolean => {
      let warp = this.perlin.domainWarp(this.warp, x / this.zoom, y / this.zoom, 0)
      return this.perlin.noise(warp.x, warp.y, 0) > 0
    })
    return this
  }
  public dynamic(): this {
    this.mapBy((x: number, y: number): number => {
      let noise: number = this.perlin.dynamic(x / this.zoom, y / this.zoom, 0, new Date((new Date()).getTime() * 0.001))
      return this.perlin.quantize(noise, this.threshold)
    })
    return this
  }
  public setAmplitude(amplitude: number): this {
    this.amplitude = amplitude
    return this
  }
  public setFrequency(frequency: number): this {
    this.frequency = frequency
    return this
  }
  public setAmplitudeMultiplier(multiplier: number): this {
    this.amplitudeMultiplier = multiplier
    return this
  }
  public setFrequencyMultiplier(multiplier: number): this {
    this.frequencyMultiplier = multiplier
    return this
  }
  public multiScale(): this {
    this.mapBy((x: number, y: number): boolean => {
      return this.perlin.multiScale(this.amplitude, this.frequency, this.amplitudeMultiplier, this.frequencyMultiplier, x / this.zoom, y / this.zoom, 0) > 0
    })
    return this
  }
  private applyTurbulence(x: number, y: number, size: number): number {
    let value: number = 0
    let initialSize: number = size

    while (size >= 1) {
      value += this.perlin.noise(x / size / this.zoom, y / size / this.zoom, 0) * size
      size /= 2
    }

    return 128 * value / initialSize
  }
  public setRepetitionX(x: number): this {
    this.repetition.x = x
    return this
  }
  public setRepetitionY(y: number): this {
    this.repetition.y = y
    return this
  }
  public setTurblencePower(power: number): this {
    this.turbulence.power = power
    return this
  }
  public setTurblenceSize(size: number): this {
    this.turbulence.size = size
    return this
  }
  public marble(): this {
    this.mapBy((x: number, y: number): boolean => {
      let value: number = x * this.repetition.x / this.maze.width + y * this.repetition.y / this.maze.height + this.turbulence.power * this.applyTurbulence(x, y, this.turbulence.size) / 256
      let sin: number = 256 * Math.abs(Math.sin(value * Math.PI))

      return sin < 100
    })
    return this
  }
}
