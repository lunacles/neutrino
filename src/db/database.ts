import { User } from 'discord.js'
import JSONDBInstance from './json/instance.js'
import Log from '../utilities/log.js'
import PRNG from '../utilities/prng.js'
import Random from '../utilities/random.js'
import { FirebaseDatabase } from './firebase/database.js'
import JSONDatabase from './json/database.js'
import FirebaseInstance from './firebase/instance.js'
import config from '../config.js'
import bot from '../index.js'

interface DatabaseInterface {
  readonly version: number
  discord: {
    users: {
      cache: Map<string, DatabaseInstanceInterface>
      fetch(id: string | User): Promise<DatabaseInstanceInterface>
    },
    refreshLeaderboard(): void
    leaderboard: BinaryHeapInterface<string>
    members: Map<string, string>
  },
}

const xpReward: Pair<number> = [15, 25]
const cooldown: number = 1e3 * 5//60 // 60 seconds

const Type = (config.databaseType === 'json' ? JSONDBInstance : FirebaseInstance) as { new (user: User): DatabaseActions }
const DatabaseInstance = class extends Type implements DatabaseInstanceInterface {
  public data: DiscordUserData
  public prng: Function
  public ran: RandomInterface
  public xp: number
  public level: number
  public cooldown: number
  public score: number
  public shieldEnd: number
  public rolePersist: {
    [key: string]: string
  }
  public neutrinoId: string
  constructor(user: User) {
    super(user)
    this.data = null
    // insert us into the leaderboard heap
    if (!Database.discord.leaderboard.heap.includes(user.id))
      Database.discord.leaderboard.insert(user.id)
  }
  public async getData(): Promise<void> {
    this.data = await this.fetch()
    this.prng = PRNG.sfc32(...this.data.prng)
    this.ran = new Random(this.prng)

    this.xp = this.data.xp_data.xp
    this.level = this.data.xp_data.level
    this.cooldown = this.data.xp_data.cooldown
    this.score = this.data.loot_league.score
    this.shieldEnd = this.data.loot_league.shield_end
    this.rolePersist = this.data.role_persist
    this.neutrinoId = this.data.neutrino_id
  }
  public async random(n: number = 1.0): Promise<number> {
    let rng = this.ran.float(n)
    await this.updateField('prng', this.prng(true))
    return rng
  }
  public async randomInt(n: number = 1.0): Promise<number> {
    let rng = this.ran.integer(n)
    await this.updateField('prng', this.prng(true))
    return rng
  }
  public async fromRange(min: number, max: number, type: 'Integer' | 'Float' = 'Integer'): Promise<number> {
    let n = this.ran.fromRange(min, max)[`as${type}`]()
    await this.updateField('prng', this.prng(true))
    return n
  }
  public async setShield(state: number): Promise<void> {
    await this.updateFieldValue('loot_league', 'shield_end',  state)
    this.shieldEnd = state
  }
  public async setScore(amount: number): Promise<void> {
    await this.updateFieldValue('loot_league', 'score',  amount)
    this.score = amount

    // refresh the binary heap if our score belongs on the leaderboard
    if (Database.discord.leaderboard.belongs(this.user.id))
      Database.discord.refreshLeaderboard()
  }
  public async setXP(amount: number): Promise<void> {
    await this.updateFieldValue('xp_data', 'xp',  amount)
    this.xp = amount
  }
  public async xpCooldown(length: number): Promise<void> {
    let time: number = Date.now() + length
    await this.updateFieldValue('xp_data', 'cooldown',  time)
    this.cooldown = time
  }
  public levelFromXP(level: number): number {
    return 1.6667 * level ** 3 + 22.5 * level ** 2 + 75.8333 * level
  }
  public async setLevel(level: number): Promise<void> {
    let xp = this.levelFromXP(level)
    await this.updateFieldValue('xp_data', 'level',  level)
    this.setXP(xp)
    this.level = level
  }
  public async passiveXP(): Promise<void> {
    if (Date.now() / 1e3 > this.cooldown / 1e3) {
      this.xp += this.ran.fromRange(...xpReward).asInteger()

      if (this.xp > Math.round(this.levelFromXP(this.level + 1))) {
        await this.setLevel(this.level + 1)
        Log.info(`User with id "${this.user.id}" leveled up to ${this.level}`)
      } else {
        this.setXP(this.xp)
      }
      await this.xpCooldown(cooldown)
    }
  }
  public async addRolePersistence(roleId: string, serverId: string): Promise<void> {
    await this.setFieldValue('role_persist', serverId, roleId)
  }
  public async removeRolePersistence(roleId: string): Promise<void> {
    await this.removeFieldValue('role_persist', roleId)
  }
}

const Database: DatabaseInterface = {
  version: 1,
  discord: {
    users: {
      cache: new Map<string, DatabaseInstanceInterface>(),
      async fetch(user: string | User): Promise<DatabaseInstanceInterface> {
        if (typeof user === 'string') {
          if (user.startsWith('anon')) {
            user = await bot.fetchUser(Database.discord.members.get(user))
          } else {
            user = await bot.fetchUser(user)
          }
        }
        let cached: DatabaseInstanceInterface = this.cache.get(user.id)

        if (!cached) {
          cached = this.cache.set(user.id, new DatabaseInstance(user)).get(user.id)
          await cached.getData()
        }

        return cached
      },
    },
    async refreshLeaderboard(): Promise<void> {
      this.leaderboard.refresh()
      if (config.databaseType === 'json') {
        JSONDatabase.data.leaderboard = this.leaderboard.heap
      } else {
        const db: FirebaseDatabaseInterface = new FirebaseDatabase()
        db.cd('~/').getdoc('leaderboard')
        await db.write(FirebaseDatabase.structureData({
          members: this.leaderboard.heap
        }))
      }
    },
    leaderboard: null,
    members: null
  }
}

export default Database
