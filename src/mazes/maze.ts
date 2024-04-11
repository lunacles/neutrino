import {
  Random,
  RandomInterface,
} from '../utilities/random.js'
import {
  PRNG,
} from '../utilities/prng.js'
import {
  RandomWalkerInterface,
} from './algorithms/randomwalker.js'
import {
  NoiseInterface,
} from './algorithms/noise.js'
import Log from './../utilities/log.js'

export type Seed = string | number
type Pair = [number, number]
type Algorithm = RandomWalkerInterface | NoiseInterface

export interface Wall {
  x: number
  y: number
  width: number
  height: number
}

export interface MazeInterface {
  width: number
  height: number
  mazeSeed: Seed
  inverse: boolean
  array: Array<any>
  seed: number
  walls: Array<Wall>
  alreadyPlaced: Array<any>
  ran: RandomInterface

  get(x: number, y: number): any
  set(x: number, y: number, value: any): any
  entries(): Array<any>
  has(x: number, y: number): boolean
  findPockets(): void
  combineWalls(): void
  mergeWalls(): void
}

export const Maze = class MazeInterface {
  public width: number
  public height: number
  public mazeSeed: Seed
  public inverse: boolean
  public array: Array<any>
  public seed: number
  public walls: Array<Wall>
  public alreadyPlaced: Array<any>
  public ran: RandomInterface

  constructor(width: number, height: number, prng: Function = PRNG.MathRandom, inverse: boolean) {
    this.width = width
    this.height = height
    this.array = Array(width * height).fill(+inverse)
    this.walls = []
    for (let [x, y, _] of this.entries().filter(([x, y, _]) => !this.has(x, y)))
      this.set(x, y, 0)

    this.ran = new Random(prng)
    this.alreadyPlaced = []
  }
  public get(x: number, y: number): any {
    return this.array[y * this.width + x]
  }
  public set(x: number, y: number, value: any): void {
    this.array[y * this.width + x] = value
  }
  public entries(): Array<any> {
    return this.array.map((value, i) => [i % this.width, Math.floor(i / this.width), value])
  }
  public has(x: number, y: number): boolean {
    return x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1
  }
  public findPockets(): this {
    let queue: Array<Pair> = [[0, 0]]
    this.set(0, 0, 2)

    let checkedIndices = new Set([0])
    for (let i = 0; i < 5e3 && queue.length > 0; i++) {
      let [x, y] = queue.shift()
      for (let [nx, ny] of [
        [x - 1, y], // left
        [x + 1, y], // right
        [x, y - 1], // top
        [x, y + 1], // bottom
      ]) {
        //if (!this.has(nx, ny) || this.get(nx, ny) !== 0) continue
        if (nx < 0 || nx > this.width - 1 || ny < 0 || ny > this.height - 1) continue
        if (this.get(nx, ny) !== 0) continue
        let i = ny * this.width + nx
        if (checkedIndices.has(i)) continue
        checkedIndices.add(i)
        queue.push([nx, ny])
        this.set(nx, ny, 2)
      }
    }

    try {
      for (let [x, y, r] of this.entries()) {
        if (r === 0)
          this.set(x, y, 1)
      }
    } catch (err) {
      Log.error('Failed to fill pockets', err)
      throw new Error()
    }
    return this
  }

  public combineWalls(): this {
    let walls: Array<Wall> = []
    let array = this.array.slice()
    do {
      let best: Pair
      let maxSize = 0
      for (let [x, y, r] of this.entries()) {
        if (r !== 1) continue
        let size = 1
        loop: while (this.has(x + size, y + size)) {
          for (let v = 0; v <= size; v++)
            if (this.get(x + size, y + v) !== 1 || this.get(x + v, y + size) !== 1)
              break loop

          size++
        }
        if (size > maxSize) {
          maxSize = size
          best = [x, y]
        }
      }
      if (!best) break
      for (let y = 0; y < maxSize; y++) {
        for (let x = 0; x < maxSize; x++) {
          this.set(best[0] + x, best[1] + y, 0)
        }
      }
      walls.push({
        x: best[0], y: best[1],
        width: maxSize, height: maxSize,
      })
    } while ([].concat(...this.entries().filter(([x, y, r]) => r)).length > 0)
    this.walls = walls
    this.array = array
    return this
  }
  public mergeWalls(): this {
    let walls: Array<Wall> = []
    let array = this.array.slice()
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (this.get(x, y) !== 1) continue
        let chunk: Wall = {
          x, y,
          width: 1, height: 1
        }
        while (this.get(x + chunk.width, y) === 1) {
          this.set(x + chunk.width, y, 0)
          chunk.width++

          walls.push(chunk)
        }
        outer: while (true) {
          for (let i = 0; i < chunk.width; i++) {
            if (this.get(x + i, y + chunk.height) !== 1) break outer
          }
          for (let i = 0; i < chunk.width; i++)
            this.set(x + i, y + chunk.height, 0)
          chunk.height++

          walls.push(chunk)
        }
        walls.push(chunk)
      }
    }
    this.walls = walls
    this.array = array
    return this
  }
  public runAlgorithm(algorithm: Algorithm): this {
    algorithm.maze = this
    algorithm.ran = this.ran
    algorithm.init()
    return this
  }
}
