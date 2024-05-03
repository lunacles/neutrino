import {
  User,
  GuildMember,
  Role,
} from 'discord.js'
import {
  DocumentData,
  DocumentReference,
  Timestamp,
} from 'firebase-admin/firestore'
import {
  Database,
  DatabaseInterface,
  OperationType
} from '../firebase/database.js'
import {
  UserInfo,
  GuildRole,
  GuildMemberInfo,
  OperationInterface,
} from './datainterface.js'

import Log from '../utilities/log.js'
import * as util from '../utilities/util.js'
import {
  //FireStorage,
  FireStorageInterface,
} from '../firebase/storage.js'
import {
  LootLeague,
  LootLeagueInterface
} from './lootleague.js'
import {
  XPManager,
  XPManagerInterface

} from './xp.js'
import {
  GuildCollection,
  GuildCollectionInterface
} from './guildcollection.js'

export interface UserDataInterface {
  operations: Array<OperationInterface>
  storage: FireStorageInterface
  database: DatabaseInterface
  user: User
  member: GuildMember

  globalData: UserInfo
  guildData: GuildMemberInfo
  guildCollection: GuildCollectionInterface
  xpData: XPManagerInterface
  lootLeague: LootLeagueInterface
  guild: DatabaseInterface
  doc: DocumentReference<DocumentData, DocumentData>
  data: DocumentData

  setup(): OperationInterface
  restoreData(): Promise<this>
  create(): Promise<this>
  writeBatch(): Promise<this>
}

export const UserData = class UserDataInterface {
  public static async fetch(member: GuildMember, guildCollection?: GuildCollectionInterface): Promise<UserDataInterface> {//UserDataInterface> {
    let collection: GuildCollectionInterface = guildCollection ?? await GuildCollection.fetch(member.guild.id)
    return collection.members.get(member.id) ?? collection.members.set(member.id, await UserData.compile(collection, member.id)).get(member.id)
  }
  public static async compile(collection: GuildCollectionInterface, id: string, data?: GuildMemberInfo): Promise<UserDataInterface> {
    let user: User = await util.fetchUser(id)
    let member: GuildMember = await util.fetchGuildMember(id, collection.guild)
    let userData = await new UserData(user, member, collection).restoreData(data)
    return userData
  }
  public operations: Array<OperationInterface>
  public storage: FireStorageInterface
  public database: DatabaseInterface
  public user: User
  public member: GuildMember

  public globalData: UserInfo
  public guildData: GuildMemberInfo
  public guildCollection: GuildCollectionInterface
  public xpData: XPManagerInterface
  public lootLeague: LootLeagueInterface
  public guild: DatabaseInterface
  public doc: DocumentReference<DocumentData, DocumentData>
  public data: DocumentData
  constructor(user: User, member: GuildMember, collection: GuildCollectionInterface) {
    this.operations = []

    this.user = user
    this.member = member
    this.guildCollection = collection
    this.storage = null//new FireStorage()
    this.database = collection.guildDatabase//new Database()

    this.globalData = null
    this.guildData = null
    this.xpData = null
    this.lootLeague = null

    this.data = null
  }
  public setup(): OperationInterface {
    this.guildData = {
      id: this.user.id,
      roles: new Map(this.member.roles.cache.map((role: Role): [string, GuildRole] => [role.id, {
        name: role.name,
        color: role.hexColor,
        icon: role.icon,
      }])),
      nickname: this.member.nickname,
      avatar: this.member.avatarURL(),
      joined: this.member.joinedTimestamp,
      xpData: new XPManager(this).setup(),
      scoreGame: new LootLeague(this).setup(),
      global: {
        id: this.user.id,
        creationDate: Timestamp.fromDate(this.user.createdAt),
        username: this.user.username,
        displayName: this.user.globalName,
        avatar: this.user.avatarURL(),
        banner: this.user.bannerURL(),
        avatarDecoration: this.user.avatarDecorationURL(),
      }
    } satisfies GuildMemberInfo

    return {
      type: OperationType.Update,
      ref: this.guildCollection.ref,
      data: Database.structureData({
        [`members.${this.user.id}`]: this.guildData
      }),
    }
  }
  public async restoreData(data?: GuildMemberInfo): Promise<this> {
    if (data) {
      this.data = data
      this.xpData = await XPManager.restore(this, data.xpData)
      this.lootLeague = await LootLeague.restore(this, data.scoreGame)
    } else {
      await this.create()
    }
    return this
  }

  public async create(): Promise<this> {
    try {
      this.operations.push(this.setup())
      await this.writeBatch()

      Log.info(`Creating document for user with id "${this.user.id}"`)

      return this
    } catch (err) {
      Log.error(`Failed to create document for user with id ${this.user.id}`, err)
      await this.writeBatch([{
        type: OperationType.Delete,
        ref: this.guildCollection.ref,
        data: Database.structureData({
          [`members.${this.user.id}`]: null
        }),
      }])
    }
  }
  public async writeBatch(batch?: Array<OperationInterface>): Promise<this> {
    await Database.batchWrite(batch ?? this.operations)
    this.operations = []
    return this
  }
}
