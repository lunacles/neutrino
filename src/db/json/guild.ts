import {
  Guild,
} from 'discord.js'
import Random from '../../utilities/random.js'
import Log from '../../utilities/log.js'
import PRNG from '../../utilities/prng.js'
import Secret from '../../utilities/secret.js'
import JSONAction from './action.js'
import JSONDatabase from './database.js'
import BinaryHeap from '../../utilities/heap.js'
import Database from '../database.js'

const JSONGuildInstance = class extends JSONAction implements JSONDBInstanceInterface {
  public guild: Guild
  public data: DiscordGuildData
  public prng: Function
  public ran: RandomInterface
  public leaderboard: BinaryHeapInterface<string>
  public rolePersist: Set<string>
  public ignoredChannels: Set<string>
  public neutrinoGuildId: string
   constructor(instance: Guild) {
    super(instance)
    this.guild = instance as Guild
    this.id = this.guild.id

    this.data = null
  }
  public fetch(): void {
    this.data = JSONDatabase.data.guilds[this.id]
    if (!this.data) {
      Log.info(`Creating document for user with id "${this.id}"`)
      this.data = this.create()
    } else {
      Log.info(`Fetching document data of user with id "${this.id}"`)
    }

    this.prng = PRNG.crypto()//.sfc32(...this.data.prng)
    this.ran = new Random(this.prng)
    this.rolePersist = new Set(this.data.role_persist)
    this.leaderboard = new BinaryHeap<string>((a: string, b: string): boolean => {
      // because of the database instance structure the entries we check will always be in the cache
      let adi = Database.discord.users.cache.get(a)?.score ?? 0
      let bdi = Database.discord.users.cache.get(b)?.score ?? 0

      return adi > bdi
    }, 10).build(this.data.leaderboard)
    this.ignoredChannels = new Set(this.data.ignored_channels)
    this.neutrinoGuildId = this.data.neutrino_guild_id
  }
  public create(): DiscordGuildData {
    JSONDatabase.data.guilds[this.id] = {
      leaderboard: [],
      neutrino_guild_id: `guild-${Secret.hash('neutrino::' + this.guild.id).slice(0, 8)}`,
      owner_id: this.guild.ownerId,
      icon: this.guild.iconURL(),
      creation_date: this.guild.createdTimestamp,
      id: this.guild.id,
      role_persist: [],
      db_timestamp: Date.now(),
      prng: ((): Quaple<number> => {
        let hash = Secret.hash(this.guild.id)
        let seeds = []
        for (let i = 0; i < 4; i++)
          // treated it as unsigned 32-bit integer
          seeds.push(parseInt(hash.substring(i * 8, (i + 1) * 8), 16) >>> 0)

        return seeds as Quaple<number>
      })(),
      ignored_channels: [],
    } satisfies DiscordGuildData

    return JSONDatabase.data.guilds[this.id]
  }
  public random(n: number = 1.0): number {
    let rng = this.ran.float(n)
    this.updateField('prng', this.prng(true))
    return rng
  }
  public randomInt(n: number = 1.0): number {
    let rng = this.ran.integer(n)
    this.updateField('prng', this.prng(true))
    return rng
  }
  public fromRange(min: number, max: number, type: 'Integer' | 'Float' = 'Integer'): number {
    let n = this.ran.fromRange(min, max)[`as${type}`]()
    this.updateField('prng', this.prng(true))
    return n
  }
}

export default JSONGuildInstance
