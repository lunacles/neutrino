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

const FirebaseGuildInstance = class extends FirebaseAction implements FirebaseInstanceInterface {
  protected prng: Function
  protected ran: RandomInterface
  public guild: Guild
  public data: DiscordGuildData
  public ignoredChannels: Set<string>
  public neutrinoGuildId: string
  public options: DiscordGuildOptions
  public id: string
  constructor(guild: Guild) {
    super(guild.id, 'guilds')

    this.guild = guild as Guild
    this.id = guild.id
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
    this.options = this.data.options

    this.ignoredChannels = new Set(this.data.ignored_channels)
    this.neutrinoGuildId = this.data.neutrino_guild_id
  }
  // Create a guild doc
  protected async create(): Promise<DocumentReference> {
    // Tbh idk why I added neutrino IDs
    // Maybe it'll be useful later idk

    // Publish it to the database
    return await this.db.cd('~/').touch(this.id, {
      neutrino_guild_id: Secret.id(`neutrino::${this.guild.id}`, 'guild'),
      owner_id: this.guild.ownerId,
      icon: this.guild.iconURL(),
      creation_date: this.guild.createdTimestamp,
      id: this.guild.id,
      db_timestamp: Date.now(),
      ignored_channels: [],
      options: {
        apply_persistence: false,
        logs: {
          moderation: null,
          invite: null,
          reactions: null,
          messages: null,
          content: null,
          poll: null,
          channels: null,
          roles: null,
          voice_channels: null,
          webhooks: null,
          members: null,
        },
      },
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
