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
  public id: string
  public data: DiscordUserData
  public neutrinoUserId: string
  public bans: Array<BanInfo>
  protected prng: Function
  protected ran: RandomInterface
   constructor(user: User) {
    super(user.id, 'users')

    this.user = user as User
    this.id = user.id
  }
  // Fetch the user doc
  public async fetch(): Promise<void> {
    // Ref it
    let doc: DocumentSnapshot = await this.ref.get()
    if (!doc.exists) {
      Log.db(`Creating document for user with id "${this.user.id}"`)
      doc = await (await this.create()).get()
    } else {
      Log.db(`Fetching document data of user with id "${this.user.id}"`)
    }
    this.data = doc.data() as DiscordUserData

    // Recommended PRNG is PRNG.crypto()
    // Much harder to exploit than Math.random()
    this.prng = PRNG.crypto()
    this.ran = new Random(this.prng)
    this.bans = this.data.bans

    this.neutrinoUserId = this.data.neutrino_id
  }
  // Create a user doc
  protected async create(): Promise<DocumentReference> {
    return await this.db.cd('~/').touch(this.user.id, {
      neutrino_id: Secret.id(`neutrino::${this.user.id}`, 'user'),
      avatar: this.user.avatarURL(),
      avatar_decoration: this.user.avatarDecoration,
      banner: this.user.bannerURL(),
      creation_date: this.user.createdTimestamp,
      display_name: this.user.displayName,
      id: this.user.id,
      username: this.user.username,
      db_timestamp: Date.now(),
      bans: [],
    } satisfies DiscordUserData)
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
  // Get a random float or integer from a provided range
  public async fromRange(min: number, max: number, type: 'Integer' | 'Float' = 'Integer'): Promise<number> {
    let n = this.ran.fromRange(min, max)[`as${type}`]()
    //await this.updateField('prng', this.prng(true))
    return n
  }
}

export default FirebaseUserInstance
