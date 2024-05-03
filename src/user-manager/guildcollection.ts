import {
  Guild,
} from 'discord.js'
import {
  Database,
  DatabaseInterface,
} from '../firebase/database.js'
import {
  UserData,
  UserDataInterface,
} from './userdoc.js'
import {
  GuildInfo,
  GuildMemberInfo,
} from './datainterface.js'
import * as util from '../utilities/util.js'
import {
  DocumentReference,
  DocumentSnapshot
} from 'firebase-admin/firestore'
import Log from '../utilities/log.js'

export interface GuildCollectionInterface {
  guild: Guild
  guildDatabase: DatabaseInterface
  members: Map<string, UserDataInterface>
  data: GuildInfo
  ref: DocumentReference

  fetchData(): Promise<this>
  fetchMember(id: string): Promise<UserDataInterface>
  setup(): Promise<DocumentReference>
}

export const GuildCollection = class GuildCollectionInterface {
  public static async fetch(id: string): Promise<GuildCollectionInterface> {
    let guild: Guild = await util.fetchGuild(id)
    let collection: GuildCollectionInterface = Database.guilds.get(id)
    return collection ?? await new GuildCollection(guild).fetchData()
  }
  public guild: Guild
  public guildDatabase: DatabaseInterface
  public members: Map<string, UserDataInterface>
  public ref: DocumentReference
  public data: GuildInfo
  constructor(guild: Guild) {
    this.guild = guild

    this.guildDatabase = new Database()
    this.data = null
    this.members = null

    this.ref = this.guildDatabase.cd('~/').getdoc(this.guild.id)
    Database.guilds.set(guild.id, this)
  }
  public async fetchData(): Promise<this> {
    let doc: DocumentSnapshot = await this.ref.get()
    if (!doc.exists) {
      Log.info(`Creating document for guild with id "${this.guild.id}"`)

      doc = await (await this.setup()).get()
    } else {
      Log.info(`Fetching document data of guild with id "${this.guild.id}"`)
    }
    this.data = doc.data() as GuildInfo
    this.members = new Map(await Promise.all(Object.entries(this.data.members).map(
      async ([id, member]): Promise<[string, UserDataInterface]> => [id, await UserData.compile(this, member.id, member satisfies GuildMemberInfo)]))
    )
    return this
  }
  public async fetchMember(id: string): Promise<UserDataInterface> {
    let member: UserDataInterface = this.members.get(id)
    return member ?? await UserData.fetch(await util.fetchGuildMember(id, this.guild), this)
  }
  public async setup(): Promise<DocumentReference> {
    return await this.guildDatabase.cd('~/').mkdir(this.guild.id, {
      approximateMemberCount: this.guild.approximateMemberCount,
      approximatePresenceCount: this.guild.approximatePresenceCount,
      premiumSubscriptionCount: this.guild.premiumSubscriptionCount,
      memberCount: this.guild.memberCount,
      ownerId: this.guild.ownerId,
      id: this.guild.id,
      icon: this.guild.icon,
      banner: this.guild.banner,
      description: this.guild.description,
      vanityURLCode: this.guild.vanityURLCode,
      createdTimestamp: this.guild.createdTimestamp,
      joinedTimestamp: this.guild.joinedTimestamp,
      available: this.guild.available,
      large: this.guild.large,
      partnered: this.guild.partnered,
      verified: this.guild.verified,
      nsfwLevel: this.guild.nsfwLevel,
      shardId: this.guild.shardId,
      members: new Map(),
    } satisfies GuildInfo)
  }
}
