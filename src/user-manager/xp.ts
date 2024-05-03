import {
  UserDataInterface
} from './userdoc.js'
import {
  RandomInterface,
  Random,
} from '../utilities/random.js'
import Log from '../utilities/log.js'
import {
  Database,
  OperationType,
} from '../firebase/database.js'
import {
  XPData
} from './datainterface.js'

type Pair = [number, number]

export interface XPManagerInterface {
  xp: number
  level: number
  cooldown: number

  setup(): XPData
  setXP(amount: number): Promise<void>
  setLevel(level: number): Promise<void>
  setCooldown(length: number): Promise<void>
  passiveXP(): Promise<void>
}

export const XPManager = class XPManagerInterface {
  public static async restore(user: UserDataInterface, data: XPData): Promise<XPManagerInterface> {
    let manager = new XPManager(user)
    manager.xp = data.xp
    manager.level = data.level
    manager.cooldown = data.cooldown
    return manager
  }
  public static levelFromXP(level: number): number {
    return 1.6667 * level ** 3 + 22.5 * level ** 2 + 75.8333 * level
  }
  public static readonly xpReward: Pair = [15, 25]
  public static readonly cooldown: number = 1e3 * 5//60 // 60 seconds
  public static readonly roleRewards: Map<number, string> = new Map([
    [0, '878403773066784839'],    // Egg
    [7, '839992302725234709'],    // Square
    [12, '839992464831938580'],   // Triangle
    [25, '839992547702734859'],   // Pentagon
    [35, '839992638514004038'],   // Beta Pentagon
    [50, '839992726937534504'],   // Alpha Pentagon
    [65, '839992968869838849'],   // Hexagon
    [80, '943590194278453274'],   // Jewel
    [100, '1026052883768152145'], // Basic
  ])
  public xp: number
  public level: number
  public cooldown: number

  private data: UserDataInterface
  private ran: RandomInterface
  constructor(data: UserDataInterface) {
    this.xp = 0
    this.level = 0
    this.cooldown = 0

    this.data = data

    this.ran = new Random()
  }
  public setup(): XPData {
    return {
      xp: this.xp,
      level: this.level,
      cooldown: this.cooldown,
    }
  }
  public async setXP(amount: number): Promise<void> {
    this.data.operations.push({
      type: OperationType.Update,
      ref: this.data.guildCollection.ref,
      data: Database.structureData({
        ['xpData.xp']: amount
      })
    })

    this.xp = amount
  }
  public async setCooldown(length: number): Promise<void> {
    let time = Date.now() + length
    this.data.operations.push({
      type: OperationType.Update,
      ref: this.data.guildCollection.ref,
      data: Database.structureData({
        ['xpData.cooldown']: time
      })
    })

    this.cooldown = time
  }
  public async setLevel(level: number): Promise<void> {
    let xp = XPManager.levelFromXP(level)
    this.data.operations.push({
      type: OperationType.Update,
      ref: this.data.guildCollection.ref,
      data: Database.structureData({
        ['xpData.level']: level,
        ['xpData.xp']: xp
      })
    })

    this.xp = xp
    this.level = level
  }
  public async passiveXP(): Promise<void> {
    if (Date.now() / 1e3 > this.cooldown / 1e3) {
      this.xp += this.ran.fromRange(...XPManager.xpReward).asInteger()

      if (this.xp > Math.round(XPManager.levelFromXP(this.level + 1))) {
        await this.setLevel(this.level + 1)
        Log.info(`User with id "${this.data.user.id}" leveled up to ${this.level}`)
      } else {
        this.data.operations.push({
          type: OperationType.Update,
          ref: this.data.guildCollection.ref,
          data: Database.structureData({
            ['xpData.xp']: this.xp
          })
        })
      }
      await this.setCooldown(XPManager.cooldown)

      await this.data.writeBatch()
    }
  }
}
