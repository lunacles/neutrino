import { User } from 'discord.js'
import * as util from 'utilities/util.js'
import JSONDBInstance from './json/instance'
import Log from 'utilities/log'
import PRNG from 'utilities/prng'
import Random from 'utilities/random'
import BinaryHeap from 'utilities/heap'
import { FirebaseDatabase } from './firebase/database'
import JSONDatabase from './json/database'
import FirebaseInstance from './firebase/instance'
import global from 'global'
import bot from 'main'

interface DatabaseInterface {
  readonly version: number
  discord: {
    users: {
      cache: Map<string, DatabaseInstanceInterface>
      fetch(id: string | User): Promise<DatabaseInstanceInterface>
    },
    refreshLeaderboard(): void
    leaderboard: BinaryHeapInterface<string>
  },
}

const xpReward: Pair<number> = [15, 25]
const cooldown: number = 1e3 * 5//60 // 60 seconds

const databaseType: DatabaseType = 'firebase' as DatabaseType
global.database = new FirebaseDatabase() as FirebaseDatabaseInterface//new JSONDatabase()
const Type = FirebaseInstance//JSONDBInstance // FirebaseInstance

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
    this.ran = new Random()

    this.xp = this.data.xp_data.xp
    this.level = this.data.xp_data.level
    this.cooldown = this.data.xp_data.cooldown
    this.score = this.data.loot_league.score
    this.shieldEnd = this.data.loot_league.shield_end
    this.rolePersist = this.data.role_persist
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
        user = typeof user === 'string' ? await util.fetchUser(user) : user
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
      if (databaseType === 'json') {
        JSONDatabase.data.leaderboard = this.leaderboard.heap
      } else {
        const db = global.database as FirebaseDatabaseInterface
        db.cd('~/').getdoc('leaderboard')
        await db.write(FirebaseDatabase.structureData({
          members: this.leaderboard.heap
        }))
      }
    },
    leaderboard: null
  }
}

if (databaseType === 'json') {
  global.database = new JSONDatabase()
  JSONDatabase.data = global.database.read()
} else {
  global.database = new FirebaseDatabase()
}

let leaderboard = databaseType === 'json' ? JSONDatabase.data.leaderboard : await FirebaseDatabase.fetchLeaderboard()
// add all the users on the leaderboard to the cache

Database.discord.leaderboard = new BinaryHeap<string>((a: string, b: string): boolean => {
  // because of the databaseinstance structure the entries we check will always be in the cache
  let adi = Database.discord.users.cache.get(a)?.score ?? 0
  let bdi = Database.discord.users.cache.get(b)?.score ?? 0

  return adi > bdi
}, 10).build(leaderboard)

const init = setInterval(async () => {
  if (bot.client) {
    await (async (): Promise<void> => {
      for (let entry of leaderboard)
        await Database.discord.users.fetch(entry)
    })()
    clearInterval(init)
  }
}, 3e3)

export default Database
