import {
  MazeInterface,
} from '../maze.js'
import {
  RandomInterface,
} from './../../utilities/random.js'
import {
  Walker,
} from '../walker.js'
import global from './../../utilities/global.js'

type Coordinate = {
  x: number,
  y: number,
}
type Movement = Array<number> | number

interface WalkerChances {
  straightChance: number,
  turnChance: number,
  branchChance: number,
}

interface WalkerInstructions {
  startDirections: Array<number> | number,
  branchDirections: Array<number> | number,
}

interface WalkerSettings {
  borderWrapping: boolean,
  terminateOnContact: boolean,
}

interface WalkerLimits {
  maxLength: number,
  maxTurns: number,
  maxBranches: number,
}

const defaultWalkerChances: WalkerChances = {
  straightChance: 0.6,
  turnChance: 0.2,
  branchChance: 0,
}

const defaultWalkerInstructions: WalkerInstructions = {
  startDirections: [...global.movementOptions.horizontal as Array<number>, ...global.movementOptions.vertical as Array<number>],
  branchDirections: [...global.movementOptions.horizontal as Array<number>, ...global.movementOptions.vertical as Array<number>],
}

const defaultWalkerSettings: WalkerSettings = {
  borderWrapping: false,
  terminateOnContact: false,
}

const defaultWalkerLimits: WalkerLimits = {
  maxLength: Infinity,
  maxTurns: Infinity,
  maxBranches: Infinity,
}

export interface RandomWalkerInterface {
  maze: MazeInterface
  seedAmount: number
  type: number
  turnChance: number
  straightChance: number
  ran: RandomInterface

  walkerChances: WalkerChances
  walkerInstructions: WalkerInstructions
  walkerSettings: WalkerSettings
  walkerLimits: WalkerLimits

  init(): void
}

export const RandomWalker = class RandomWalkerInterface {
  public maze: MazeInterface
  public seedAmount: number
  public type: number
  public turnChance: number
  public straightChance: number

  public walkerChances: WalkerChances
  public walkerInstructions: WalkerInstructions
  public walkerSettings: WalkerSettings
  public walkerLimits: WalkerLimits

  public ran: RandomInterface
  private seeds: Array<Coordinate>
  constructor(seedAmount: number = 1, inverse: boolean) {
    this.maze = null
    this.ran = null
    this.seedAmount = seedAmount
    this.turnChance = 0
    this.straightChance = 0
    this.type = +inverse

    this.seeds = []
  }
  public init(): void {
    this.place()

    for (let seed of this.seeds) {
      let walker = new Walker({
        setup: {
          x: seed.x,
          y: seed.y,
          maze: this.maze,
          ran: this.ran,
        },
        chances: this.walkerChances,
        instructions: this.walkerInstructions,
        settings: this.walkerSettings,
        limits: this.walkerLimits
      })
      walker.walk(this.type)
    }

    this.maze.findPockets()
  }
  private validateCell(position: Coordinate): boolean {
    if (!this.maze.has(position.x, position.y)) return false
    return true
  }
  private place(): void {
    let amount = 0
    for (let i = 0; i < 1e3; i++) {
      let loc: Coordinate = {
        x: this.ran.integer(this.maze.width) - 1,
        y: this.ran.integer(this.maze.height) - 1,
      }

      if (this.validateCell(loc)) {
        this.seeds.push(loc)
        this.maze.set(loc.x, loc.y, this.type)
        amount++
        if (amount >= this.seedAmount) break
      }
    }
  }
  public setWalkerChances(straightChance?: number, turnChance?: number, branchChance?: number): this {
    this.walkerChances = {
      straightChance: straightChance ?? defaultWalkerChances.straightChance,
      turnChance: turnChance ?? defaultWalkerChances.turnChance,
      branchChance: branchChance ?? defaultWalkerChances.branchChance,
    }
    return this
  }
  public setWalkerInstructions( startDirection?: Movement, branchDirection?: Movement): this {
    this.walkerInstructions = {
      startDirections: startDirection ?? defaultWalkerInstructions.startDirections,
      branchDirections: branchDirection ?? defaultWalkerInstructions.branchDirections,
    }
    return this
  }
  public setWalkerSettings(borderWrapping?: boolean, terminateOnContact?: boolean): this {
    this.walkerSettings = {
      borderWrapping: borderWrapping ?? defaultWalkerSettings.borderWrapping,
      terminateOnContact: terminateOnContact ?? defaultWalkerSettings.terminateOnContact,
    }
    return this
  }
  public setWalkerLimits(maxLength?: number, maxTurns?: number, maxBranches?: number): this {
    this.walkerLimits = {
      maxLength: maxLength ?? defaultWalkerLimits.maxLength,
      maxTurns: maxTurns ?? defaultWalkerLimits.maxTurns,
      maxBranches: maxBranches ?? defaultWalkerLimits.maxBranches,
    }
    return this
  }
}
