// Created using Ken Perlin's Java reference implementation of improved noise https://cs.nyu.edu/~perlin/
import Random from '../utilities/random.js'

const ImprovedNoise = class ImprovedNoiseInterface {
  private p: Array<number>
  private permutation: Array<number>
  constructor(mutation: Mutation) {
    this.p = new Array(512)
    this.permutation = Array(256).fill(0).map(() => Math.floor(255 * ((mutation instanceof Random ? mutation.float() : mutation) as number)))
    for (let i: number = 0; i < 256; i++)
      this.p[256 + i] = this.p[i] = this.permutation[i]
  }
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }
  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a)
  }
  private grad(hash: number, x: number, y: number, z: number): number {
    let h: number = hash & 15
    let u: number = h < 8 ? x : y
    let v: number = h < 4 ? y : h === 12 || h === 14 ? x : z
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
  }
  public noise(x: number, y: number, z: number): number {
    let ix: number = Math.floor(x) & 255
    let iy: number = Math.floor(y) & 255
    let iz: number = Math.floor(z) & 255

    x -= Math.floor(x)
    y -= Math.floor(y)
    z -= Math.floor(z)

    let u: number = this.fade(x)
    let v: number = this.fade(y)
    let w: number = this.fade(z)

    let a: number = this.p[ix] + iy
    let aa: number = this.p[a] + iz
    let ab: number = this.p[a + 1] + iz
    let b: number = this.p[ix + 1] + iy
    let ba: number = this.p[b] + iz
    let bb: number = this.p[b + 1] + iz

    let result: number = this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[aa], x, y, z), this.grad(this.p[ba], x - 1, y, z)), this.lerp(u, this.grad(this.p[ab], x, y - 1, z), this.grad(this.p[bb], x - 1, y - 1, z))), this.lerp(v, this.lerp(u, this.grad(this.p[aa + 1], x, y, z - 1), this.grad(this.p[ba + 1], x - 1, y, z - 1)), this.lerp(u, this.grad(this.p[ab + 1], x, y - 1, z - 1), this.grad(this.p[bb + 1], x - 1, y - 1, z - 1))))

    return result
  }
  public quantize(value: number, threshold: number): number {
    return value > threshold ? 1 : 0
  }
  public dynamic(x: number, y: number, z: number, time: Date | number): number {
    let frequency: number = Math.sin(time as number * 0.1) * 2 + 3

    let offsetX: number = Math.cos(time as number * 0.1) * 10
    let offsetY: number = Math.sin(time as number * 0.1) * 10
    let offsetZ: number = Math.cos(time as number * 0.1) * 10

    let result: number = this.noise((x + offsetX) * frequency, (y + offsetY) * frequency, (z + offsetZ) * frequency)
    return result
  }
  public domainWarp(warp: number, x: number, y: number, z: number): DomainWarp {
    let dx: number = this.noise(x, y, z)
    let dy: number = this.noise(x + warp, y + warp, z + warp)
    let dz: number = this.noise(x - warp, y - warp, z - warp)
    return { x: x + dx, y: y + dy, z: z + dz }
  }
  public multiScale(amplitude: number, frequency: number, amplitudeMultiplier: number, frequencyMultiplier: number, x: number, y: number, z: number): number {
    let value: number = 0
    for (let i: number = 0; i < 3; i++) {
      value += this.noise(x * frequency, y * frequency, z * frequency) * amplitude
      amplitude *= amplitudeMultiplier
      frequency *= frequencyMultiplier
    }
    return value
  }
}

export default ImprovedNoise
