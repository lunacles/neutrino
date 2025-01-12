import {
  Guild,
} from 'discord.js'
import {
  DocumentReference,
  DocumentSnapshot,
} from 'firebase-admin/firestore'
import Log from '../../utilities/log.js'
import Secret from '../../utilities/secret.js'
import FirebaseAction from './action.js'
import PRNG from '../../utilities/prng.js'
import Random from '../../utilities/random.js'
import BinaryHeap from '../../utilities/heap.js'
import Database from '../database.js'

const FirebaseGuildInstance = class extends FirebaseAction implements FirebaseInstanceInterface {
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
  }
  // Fetch a guild doc
  public async fetch(): Promise<void> {
    // Ref it
    let doc: DocumentSnapshot = await this.ref.get()
    if (!doc.exists) {
      Log.db(`Creating document for guild with id "${this.id}"`)
      doc = await (await this.create()).get()
    } else {
      Log.db(`Fetching document data of guild with id "${this.id}"`)
    }
    this.data = doc.data() as DiscordGuildData

    // Recommended PRNG is PRNG.crypto()
    // Much harder to exploit than Math.random()
    this.prng = PRNG.crypto()
    this.ran = new Random(this.prng)

    this.ignoredChannels = new Set(this.data.ignored_channels)
    this.neutrinoGuildId = this.data.neutrino_guild_id
  }
  // Create a guild doc
  protected async create(): Promise<DocumentReference> {
    // Tbh idk why I added neutrino IDs
    // Maybe it'll be useful later idk
    let neutrinoGuildId = `guild-${Secret.hash('neutrino::' + this.guild.id).slice(0, 8)}`

    // Publish it to the database
    return await this.db.cd('~/').mkdir(this.id, {
      leaderboard: [],
      neutrino_guild_id: neutrinoGuildId,
      owner_id: this.guild.ownerId,
      icon: this.guild.iconURL(),
      creation_date: this.guild.createdTimestamp,
      id: this.guild.id,
      role_persist: [],
      db_timestamp: Date.now(),
      // TODO: Redo this shit this is like only here for using SFC32
      prng: ((): Quaple<number> => {
        let hash = Secret.hash(this.guild.id)
        let seeds = []
        for (let i = 0; i < 4; i++)
          // Treated it as unsigned 32-bit integer
          seeds.push(parseInt(hash.substring(i * 8, (i + 1) * 8), 16) >>> 0)

        return seeds as Quaple<number>
      })(),
      ignored_channels: []
    } satisfies DiscordGuildData)
  }
  // TODO: I can just not repeat this in every guild/user file
  // I'll come back to it and make it mroe global like action.ts

  // Get a random float
  public async random(n: number = 1.0): Promise<number> {
    let rng = this.ran.float(n)
    //await this.updateField('prng', this.prng(true))
    return rng
  }
  // Get a random integer
  public async randomInt(n: number = 1.0): Promise<number> {
    let rng = this.ran.integer(n)
    //await this.updateField('prng', this.prng(true))
    return rng
  }
  // Get a random integer or float from a provided range
  public async fromRange(min: number, max: number, type: 'Integer' | 'Float' = 'Integer'): Promise<number> {
    let n = this.ran.fromRange(min, max)[`as${type}`]()
    //await this.updateField('prng', this.prng(true))
    return n
  }
}

export default FirebaseGuildInstance
