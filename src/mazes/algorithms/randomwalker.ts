import {
  Walker,
} from '../walker.js'
import global from '../../global.js'

const defaultWalkerChances: WalkerChances = {
  straightChance: 0.6,
  turnChance: 0.2,
  branchChance: 0,
}

const defaultWalkerInstructions: WalkerInstructions = {
  startDirections: [...global.movementOptions.horizontal as Array<number>, ...global.movementOptions.vertical as Array<number>],
  branchDirections: [...global.movementOptions.horizontal as Array<number>, ...global.movementOptions.vertical as Array<number>],
  placementType: 1,
}

const defaultWalkerSettings: WalkerSettings = {
  borderWrapping: false,
  terminateOnContact: false,
}

const defaultWalkerLimits: WalkerLimits = {
  minLength: 0,
  maxLength: Infinity,
  minTurns: 0,
  maxTurns: Infinity,
  minBranches: 0,
  maxBranches: Infinity,
}

export const RandomWalker = class RandomWalker implements RandomWalkerInterface {
  maze: MazeInterface
  seedAmount: number

  walkerChances: WalkerChances
  walkerInstructions: WalkerInstructions
  walkerSettings: WalkerSettings
  walkerLimits: WalkerLimits

  ran: RandomInterface
  seeds: Array<Coordinate>
  constructor() {
    this.maze = null
    this.ran = null
    this.seedAmount = 75

    this.seeds = []

    this.walkerChances = defaultWalkerChances
    this.walkerInstructions = defaultWalkerInstructions
    this.walkerSettings = defaultWalkerSettings
    this.walkerLimits = defaultWalkerLimits
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
      walker.walk(this.walkerInstructions.placementType)
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
        this.maze.set(loc.x, loc.y, this.walkerInstructions.placementType)
        amount++
        if (amount >= this.seedAmount) break
      }
    }
  }
  public setSeedAmount(amount: number): this {
    this.seedAmount = amount
    return this
  }
  public setPlacementType(type: number): this {
    this.walkerInstructions.placementType = type
    return this
  }
  public setStraightChance(straightChance: number): this {
    this.walkerChances.straightChance = straightChance
    return this
  }
  public setTurnChance(turnChance: number): this {
    this.walkerChances.turnChance = turnChance
    return this
  }
  public setBranchChance(branchChance: number): this {
    this.walkerChances.branchChance = branchChance
    return this
  }
  public setWalkerInstructions(startDirection?: Movement, branchDirection?: Movement): this {
    this.walkerInstructions = {
      startDirections: startDirection,
      branchDirections: branchDirection,
      placementType: this.walkerInstructions.placementType,
    }
    return this
  }
  public allowBorderWrapping(borderWrapping: boolean): this {
    this.walkerSettings.borderWrapping = borderWrapping
    return this
  }
  public terminateOnContact(terminateOnContact: boolean): this {
    this.walkerSettings.terminateOnContact = terminateOnContact
    return this
  }
  public setMinLength(minLength: number): this {
    this.walkerLimits.minLength = minLength
    return this
  }
  public setMaxLength(minLength: number): this {
    this.walkerLimits.maxLength = minLength
    return this
  }
  public setMinTurns(minTurns: number): this {
    this.walkerLimits.minTurns = minTurns
    return this
  }
  public setMaxTurns(maxTurns: number): this {
    this.walkerLimits.maxTurns = maxTurns
    return this
  }
  public setMinBranches(minBranches: number): this {
    this.walkerLimits.minBranches = minBranches
    return this
  }
  public setMaxBranches(maxBranches: number): this {
    this.walkerLimits.maxBranches = maxBranches
    return this
  }
}
