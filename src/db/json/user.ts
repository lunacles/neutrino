import {
  User,
} from 'discord.js'
import Random from '../../utilities/random.js'
import Log from '../../utilities/log.js'
import PRNG from '../../utilities/prng.js'
import Secret from '../../utilities/secret.js'
import JSONAction from './action.js'
import JSONDatabase from './database.js'

const JSONUserInstance = class extends JSONAction implements JSONDBInstanceInterface {
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
    this.id = this.user.id

    this.data = null
  }
  public fetch(): void {
    this.data = JSONDatabase.data.users[this.user.id]
    if (!this.data) {
      Log.info(`Creating document for user with id "${this.id}"`)
      this.data = this.create()
    } else {
      Log.info(`Fetching document data of user with id "${this.id}"`)
    }
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
  public create(): DiscordUserData {
    JSONDatabase.data.users[this.id] = {
      neutrino_id: Secret.id(`neutrino::${this.user.id}`, 'anon'),

      avatar: this.user.avatarURL() ?? this.user.defaultAvatarURL,
      avatar_decoration: this.user.avatarDecorationURL(),
      banner: this.user.bannerURL(),
      creation_date: this.user.createdTimestamp,
      display_name: this.user.displayName,
      id: this.id,
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
      db_timestamp: Math.floor(Date.now()),

      prng: ((): Quaple<number> => {
        let hash = Secret.hash(this.id)
        let seeds = []
        for (let i = 0; i < 4; i++)
          // treated it as unsigned 32-bit integer
          seeds.push(parseInt(hash.substring(i * 8, (i + 1) * 8), 16) >>> 0)

        return seeds as Quaple<number>
      })()
    } satisfies DiscordUserData

    return JSONDatabase.data.users[this.id]
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

export default JSONUserInstance
