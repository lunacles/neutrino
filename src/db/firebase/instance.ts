import {
  User,
} from 'discord.js'
import {
  FirebaseDatabase
} from './database.js'
import {
  DocumentReference,
  DocumentSnapshot,
  FieldValue
} from 'firebase-admin/firestore'
import Log from '../../utilities/log.js'
import { OperationType } from '../../types/enum.js'
import Secret from '../../utilities/secret.js'
import AutoComplete from '../../commands/autocomplete.js'
import Database from '../database.js'

let operations: Array<OperationInterface> = []

const FirebaseInstance = class implements FirebaseInstanceInterface {
  public user: User
  private id: string
  public db: FirebaseDatabaseInterface
  public ref: DocumentReference
   constructor(user: User) {
    this.user = user
    this.id = user.id
    this.db = new FirebaseDatabase()
    this.ref = this.db.cd('~/').getdoc(this.id)
  }
  public async fetch(): Promise<DiscordUserData> {
    let doc: DocumentSnapshot = await this.ref.get()
    if (!doc.exists) {
      Log.info(`Creating document for user with id "${this.id}"`)
      doc = await (await this.create()).get()
    } else {
      Log.info(`Fetching document data of user with id "${this.id}"`)
    }
    return doc.data() as DiscordUserData
  }
  public async updateField(field: Keys<DiscordUserData>, data: unknown): Promise<void> {
    await this.pushOperation({
      type: OperationType.Update,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [field]: data
      })
    })
  }
  public async updateFieldValue(field: Keys<DiscordUserData>, key: string, data: unknown): Promise<void> {
    await this.pushOperation({
      type: OperationType.Update,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [`${field}.${key}`]: data,
      })
    })
  }
  public async setField(field: Keys<DiscordUserData>, data: unknown): Promise<void> {
    await this.pushOperation({
      type: OperationType.Set,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [field]: data
      })
    })
  }
  public async setFieldValue(field: Keys<DiscordUserData>, key: string, data: unknown): Promise<void> {
    await this.pushOperation({
      type: OperationType.Set,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [`${field}.${key}`]: data,
      })
    })
  }
  public async removeFieldValue(field: Keys<DiscordUserData>, name: string): Promise<void> {
    await this.pushOperation({
      type: OperationType.Delete,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [`${field}.${name}`]: FieldValue.delete(),
      })
    })
  }
  public async create(): Promise<DocumentReference> {
    let neutrinoId = `anon${Secret.hash('neutrino::' + this.user.id).slice(0, 8)}`
    AutoComplete.add(neutrinoId)
    Database.discord.members.set(neutrinoId, this.user.id)

    this.db.cd('~/').getdoc('members')
    await this.db.write({
      [`map.${neutrinoId}`]: this.user.id
    })

    return await this.db.cd('~/').mkdir(this.id, {
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
      role_persist: {},
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
  private async pushOperation(operation: OperationInterface): Promise<this> {
    operations.push(operation)
    if (operations.length > 5) {
      await this.writeBatch(operations)
      operations = []
    }
    return this
  }
  public async writeBatch(batch?: Array<OperationInterface>): Promise<this> {
    await FirebaseDatabase.batchWrite(batch ?? operations)
    return this
  }
}

export default FirebaseInstance
