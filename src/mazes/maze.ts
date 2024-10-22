import Random from '../utilities/random.js'
import PRNG from '../utilities/prng.js'
import Log from './../utilities/log.js'
import Hash from '../utilities/secret.js'
import { PlacementType } from '../types/enum.js'

const Maze = class Maze implements MazeInterface {
  public static direction = {
    none: 0,  // 0000
    left: 1,  // 0001
    right: 2, // 0010
    up: 4,    // 0100
    down: 8,  // 1000
  }
  public static diagonalDirections = {
    upLeft: this.direction.left | this.direction.up,
    downLeft: this.direction.left | this.direction.down,
    upRight: this.direction.right | this.direction.up,
    downRight: this.direction.right | this.direction.down
  }
  public static movementOptions = {
    all: [
      this.direction.left, this.direction.right,
      this.direction.up, this.direction.down,
      this.diagonalDirections.upLeft, this.diagonalDirections.upRight,
      this.diagonalDirections.downLeft, this.diagonalDirections.downRight,
    ],
    diagonal: [
      this.diagonalDirections.upLeft, this.diagonalDirections.upRight,
      this.diagonalDirections.downLeft, this.diagonalDirections.downRight,
    ],
    vertical: [
     this.direction.up,this.direction.down
    ],
    horizontal: [
     this.direction.left,this.direction.right
    ],
  }

  public width: number
  public height: number
  public type: number
  public array: Array<any>
  public seed: number
  public walls: Array<Wall>
  public prng: Function
  public ran: RandomInterface

  constructor() {
    this.width = 32
    this.height = 32
    this.type = PlacementType.Empty
    this.array = Array(this.width * this.height).fill(this.type)
    this.walls = []
    for (let [x, y, _] of this.entries().filter(([x, y, _]) => !this.has(x, y)))
      this.set(x, y, 0)

    this.seed = Math.floor(Math.random() * 2147483646)
    this.prng = PRNG.simple
    this.ran = new Random(this.prng(this.seed))
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
    let queue: Array<Pair<number>> = [[0, 0]]
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
      let best: Pair<number>
      let maxSize: number = 0
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
  public runAlgorithm(algorithm: MazeAlgorithm): this {
    algorithm.maze = this
    algorithm.ran = this.ran
    algorithm.init()
    return this
  }
  public setWidth(width: number): this {
    this.width = width
    this.array = Array(this.width * this.height).fill(this.type)
    return this
  }
  public setHeight(height: number): this {
    this.height = height
    this.array = Array(this.width * this.height).fill(this.type)
    return this
  }
  public setSeed(seed: string): this {
    this.seed = seed === '' ? Math.floor(Math.random() * 2147483646) : /^\d+$/.test(seed) ? parseInt(seed) : Hash.cyrb53(seed)
    this.ran = this.ran = new Random(this.prng(this.seed))
    return this
  }
  public setPRNG(prng: Function): this {
    this.prng = prng
    this.ran = this.ran = new Random(prng(this.seed))
    return this
  }
  public fill(type: number): this {
    this.type = type
    this.array = Array(this.width * this.height).fill(type)
    return this
  }
}

export default Maze
