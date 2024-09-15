import {
  User,
} from 'discord.js'
import {
  DocumentReference,
  DocumentSnapshot,
} from 'firebase-admin/firestore'
import FirebaseAction from './action.js'
import Random from '../../utilities/random.js'
import Log from '../../utilities/log.js'
import PRNG from '../../utilities/prng.js'
import Secret from '../../utilities/secret.js'

const FirebaseUserInstance = class extends FirebaseAction implements FirebaseInstanceInterface {
  public user: User
  public data: DiscordUserData
  public neutrinoUserId: string
  public prng: Function
  public ran: RandomInterface
  public xp: number
  public level: number
  public cooldown: number
  public score: number
  public shieldEnd: number
  public rolePersist: Set<string>
   constructor(instance: User) {
    super(instance)
    this.user = instance as User
  }
  public async fetch(): Promise<void> {
    let doc: DocumentSnapshot = await this.ref.get()
    if (!doc.exists) {
      Log.info(`Creating document for user with id "${this.user.id}"`)
      doc = await (await this.create()).get()
    } else {
      Log.info(`Fetching document data of user with id "${this.user.id}"`)
    }
    this.data = doc.data() as DiscordUserData

    this.prng = PRNG.crypto()//.sfc32(...this.data.prng)
    this.ran = new Random(this.prng)

    this.xp = this.data.xp_data.xp
    this.level = this.data.xp_data.level
    this.cooldown = this.data.xp_data.cooldown
    this.score = this.data.loot_league.score
    this.shieldEnd = this.data.loot_league.shield_end
    this.rolePersist = new Set(this.data.role_persist)
    this.neutrinoUserId = this.data.neutrino_id
  }
  public async create(): Promise<DocumentReference> {
    let neutrinoId = `user-${Secret.hash('neutrino::' + this.user.id).slice(0, 8)}`
    return await this.db.cd('~/').mkdir(this.user.id, {
      neutrino_id: neutrinoId,

      avatar: this.user.avatarURL(),
      avatar_decoration: this.user.avatarDecoration,
      banner: this.user.bannerURL(),
      creation_date: this.user.createdTimestamp,
      display_name: this.user.displayName,
      id: this.user.id,
      username: this.user.username,
      xp_data: {
        level: 0,
        xp: 0,
        cooldown: 0,
      },
      loot_league: {
        score: 0,
        shield_end: 0,
      },
      role_persist: [],
      db_timestamp: Date.now(),
      prng: ((): Quaple<number> => {
        let hash = Secret.hash(this.user.id)
        let seeds = []
        for (let i = 0; i < 4; i++)
          // treated it as unsigned 32-bit integer
          seeds.push(parseInt(hash.substring(i * 8, (i + 1) * 8), 16) >>> 0)

        return seeds as Quaple<number>
      })()
    } satisfies DiscordUserData)
  }
  public async random(n: number = 1.0): Promise<number> {
    let rng = this.ran.float(n)
    //await this.updateField('prng', this.prng(true))
    return rng
  }
  public async randomInt(n: number = 1.0): Promise<number> {
    let rng = this.ran.integer(n)
    //await this.updateField('prng', this.prng(true))
    return rng
  }
  public async fromRange(min: number, max: number, type: 'Integer' | 'Float' = 'Integer'): Promise<number> {
    let n = this.ran.fromRange(min, max)[`as${type}`]()
    //await this.updateField('prng', this.prng(true))
    return n
  }
}

export default FirebaseUserInstance
