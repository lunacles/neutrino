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
} from '../firebase/database.js'
import Log from '../utilities/log.js'
import * as util from '../utilities/util.js'
//import FireStorage from '../firebase/storage.js'
import LootLeague from './lootleague.js'
import XPManager from './xp.js'
import GuildCollection from './guildcollection.js'
import {
  DatabaseInterface,
  GuildCollectionInterface,
  XPManagerInterface,
  LootLeagueInterface,
  FireStorageInterface,
  UserInfo,
  GuildRole,
  GuildMemberInfo,
  OperationInterface,
  OperationType,
} from '../types.d.js'

const UserData = class UserDataInterface {
  public static async fetch(member: GuildMember, guildCollection?: GuildCollectionInterface): Promise<UserDataInterface> {
    let collection: GuildCollectionInterface = guildCollection ?? await GuildCollection.fetch(member.guild.id)
    return collection.members.get(member.id) ?? await UserData.compile(collection, member.id)
  }
  public static async compile(collection: GuildCollectionInterface, id: string, data?: GuildMemberInfo): Promise<UserDataInterface> {
    let user: User = await util.fetchUser(id)
    let member: GuildMember = await util.fetchGuildMember(id, collection.guild)
    let userData = await new UserData(user, member, collection).restoreData(data)
    collection.members.set(member.id, userData)
    return userData
  }
  public operations: Array<OperationInterface>
  public timeSinceLastOperation: number
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
    this.timeSinceLastOperation = Date.now()

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
    this.xpData = new XPManager(this)
    this.lootLeague = new LootLeague(this)
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
      xpData: this.xpData.setup(),
      scoreGame: this.lootLeague.setup(),
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
      this.pushOperation(this.setup())
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
  public async pushOperation(operation: OperationInterface): Promise<this> {
    this.operations.push(operation)
    if (this.operations.length > 5) {
      await this.writeBatch(this.operations)
      this.operations = []
    }
    return this
  }
  public async writeBatch(batch?: Array<OperationInterface>): Promise<this> {
    await Database.batchWrite(batch ?? this.operations)

    return this
  }
}

export default UserData
