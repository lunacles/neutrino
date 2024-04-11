import {
  MazeInterface,
} from '../maze.js'
import {
  RandomInterface,
} from './../../utilities/random.js'
import {
  ImprovedNoise,
  ImprovedNoiseInterface,
} from '../perlinnoise.js'

type Coordinate = {
  x: number,
  y: number,
}
type NoiseAlgorithms = 'normal' | 'clamped' | 'quantized' | 'dynamic' | 'domainWarped' | 'multiScale' | 'marble'

export interface NoiseInterface {
  maze: MazeInterface
  ran: RandomInterface
  perlin: ImprovedNoiseInterface
  init(): void
  setThreshold(threshold: number): this
  setClamp(min: number, max: number): this
  setZoom(threshold: number): this

  normal(): this
  clamped(): this
  quantized(): this
  dynamic(): this
  domainWarped(): this
  multiScale(): this
  marble(): this
}

enum DefaultSettings {
  Zoom = 1,
  Threshold = 0.1,
  Min = -0.085,
  Max = 0.085,
  Iterations = 1,
}

export const Noise = class NoiseInterface {
  public maze: MazeInterface
  public ran: RandomInterface
  public perlin: ImprovedNoiseInterface
  private type: NoiseAlgorithms

  private zoom: number
  private threshold: number
  private min: number
  private max: number
  private iterations: number
  constructor(type: NoiseAlgorithms = 'normal') {
    this.maze = null
    this.ran = null
    this.type = type

    this.zoom = DefaultSettings.Zoom
    this.threshold = DefaultSettings.Threshold
    this.min = DefaultSettings.Min
    this.max = DefaultSettings.Max
    this.iterations = DefaultSettings.Iterations
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
  public setIterations(amount: number): this {
    this.iterations = amount
    return this
  }
  private iter(iterator: Function): void {
    for (let y: number = 0; y < this.maze.height; y++) {
      for (let x: number = 0; x < this.maze.width; x++) {
        if (!this.validateCell({ x, y })) continue

        let value: any
        value = iterator(x, y)

        this.maze.set(x, y, +value)
      }
    }
  }
  public normal(): this {
    this.iter((x: number, y: number): boolean => {
      return this.perlin.noise(x / this.zoom, y / this.zoom, 0) > 0
    })
    return this
  }
  public clamped(): this {
    this.iter((x: number, y: number): boolean => {
      let noise: number = this.perlin.noise(x / this.zoom, y / this.zoom, 0)
      return noise < this.max && noise > this.min
    })
    return this
  }
  public quantized(): this {
    this.iter((x: number, y: number): number => {
      let noise: number = this.perlin.noise(x / this.zoom, y / this.zoom, 0)
      return this.perlin.quantize(noise, this.threshold)
    })
    return this
  }
  public domainWarped(): this {
    this.iter((x: number, y: number): boolean => {
      let warp = this.perlin.domainWarp(x / this.zoom, y / this.zoom, 0)
      return this.perlin.noise(warp.x, warp.y, 0) > 0
    })
    return this
  }
  public dynamic(): this {
    this.iter((x: number, y: number): number => {
      let noise: number = this.perlin.dynamic(x / this.zoom, y / this.zoom, 0, new Date((new Date()).getTime() * 0.001))
      return this.perlin.quantize(noise, this.threshold)
    })
    return this
  }
  public multiScale(): this {
    this.iter((x: number, y: number): boolean => {
      return this.perlin.multiScale(x / this.zoom, y / this.zoom, 0) > 0
    })
    return this
  }
  private turbulence(x: number, y: number, size: number): number {
    let value: number = 0
    let initialSize: number = size

    while (size >= 1) {
      value += this.perlin.noise(x / size / this.zoom, y / size / this.zoom, 0) * size
      size /= 2
    }

    return 128 * value / initialSize
  }
  public marble(): this {
    this.iter((x: number, y: number): boolean => {
      let repetition = {
        x: 5,
        y: 5,
      }
      let turbulence = {
        power: 5,
        size: 16,
      }
      let value: number = x * repetition.x / this.maze.width + y * repetition.y / this.maze.height + turbulence.power * this.turbulence(x, y, turbulence.size) / 256
      let sin: number = 256 * Math.abs(Math.sin(value * Math.PI))

      return sin < 100
    })
    return this
  }
}
