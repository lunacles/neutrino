import { Guild, GuildMember } from 'discord.js'
import Log from '../../utilities/log.js'
import FirebaseAction from '../firebase/action.js'
import { DocumentReference, DocumentSnapshot } from 'firebase-admin/firestore'
import Random from '../../utilities/random.js'
import PRNG from '../../utilities/prng.js'
import Secret from '../../utilities/secret.js'

const FirebaseGuildMemberInstance = class extends FirebaseAction implements FirebaseInstanceInterface {
  public guild: Guild
  public guildMember: GuildMember
  public data: DiscordGuildMemberData
  public neutrinoId: string
  public rolePersist: Set<string>
  public xp: number
  public level: number
  public cooldown: number
  public score: number
  public shieldEnd: number
  public id: string
  protected prng: Function
  protected ran: RandomInterface
  constructor(member: GuildMember) {
    super(member.id, 'guilds', `${member.guild.id}/users`)

    this.guildMember = member
    this.guild = member.guild
    this.id = member.id

    this.data = null
    this.prng = null
    this.ran = null

    this.xp = null
    this.level = null
    this.cooldown = null

    this.score = null
    this.shieldEnd = null

    this.neutrinoId = null
  }
  // Fetch a guild doc
  public async fetch(): Promise<void> {
    // Ref it
    let doc: DocumentSnapshot = await this.ref.get()
    if (!doc.exists) {
      Log.db(`Creating document for guild member with id "${this.id}"`)
      doc = await (await this.create()).get()
    } else {
      Log.db(`Fetching document data of guild member with id "${this.id}"`)
    }

    this.init(doc)
  }
  public init(doc: DocumentSnapshot): void {
    this.data = doc.data() as DiscordGuildMemberData
    let { xp, level, cooldown } = this.data.xp_data
    let { score, shield_end } = this.data.loot_league

    // Recommended PRNG is PRNG.crypto()
    // Much harder to exploit than Math.random()
    this.prng = PRNG.crypto()//.sfc32(...this.data.prng)
    this.ran = new Random(this.prng)

    this.rolePersist = new Set(this.data.role_persist)

    this.xp = xp
    this.level = level
    this.cooldown = cooldown

    this.score = score
    this.shieldEnd = shield_end

    this.neutrinoId = this.data.neutrino_id
  }
  // Create a guild doc
  protected async create(): Promise<DocumentReference> {
    // Publish it to the database
    return await this.db.cd(`~/${this.guild.id}/users`).touch(this.guildMember.id, {
      neutrino_id: Secret.id(`neutrino::${this.guildMember.id}`, 'user'),
      id: this.guildMember.id,
      guild_avatar: this.guildMember.avatarURL(),
      join_date: Math.floor(this.guildMember.joinedAt.getTime() / 1000),
      left_date: null,
      db_timestamp: Date.now(),
      nickname: this.guildMember.nickname,
      role_persist: Array.from(this.guildMember.roles.cache.keys()),
      xp_data: {
        level: 0,
        cooldown: 0,
        xp: 0,
      },
      loot_league: {
        score: 0,
        shield_end: 0,
      },
      warns: {},
      mutes: {},
      bans: {},
    } satisfies DiscordGuildMemberData)
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

export default FirebaseGuildMemberInstance
