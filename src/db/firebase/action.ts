import {
  Guild,
  User,
} from 'discord.js'
import {
  FirebaseDatabase
} from './database.js'
import {
  DocumentReference,
  FieldValue
} from 'firebase-admin/firestore'
import { OperationType } from '../../types/enum.js'

let operations: Array<OperationInterface> = []

const FirebaseAction = class implements DatabaseActions {
  public instance: User | Guild
  public id: string
  public db: FirebaseDatabaseInterface
  public ref: DocumentReference
  constructor(instance: User | Guild) {
    this.instance = instance
    this.id = instance.id

    this.db = new FirebaseDatabase(instance instanceof Guild ? 'guilds' : 'users')
    this.ref = this.db.cd('~/').getdoc(this.id)
  }
  public async updateField(field: DataKeys, data: unknown): Promise<void> {
    await this.pushOperation({
      type: OperationType.Update,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [field]: data
      })
    })
  }
  public async updateFieldValue(field: DataKeys, key: string, data: unknown): Promise<void> {
    await this.pushOperation({
      type: OperationType.Update,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [`${field}.${key}`]: data,
      })
    })
  }
  public async setField(field: DataKeys, data: unknown): Promise<void> {
    await this.pushOperation({
      type: OperationType.Set,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [field]: data
      })
    })
  }
  public async setFieldValue(field: DataKeys, key: string, data: unknown): Promise<void> {
    await this.pushOperation({
      type: OperationType.Set,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [`${field}.${key}`]: data,
      })
    })
  }
  public async removeFieldValue(field: DataKeys, name: string): Promise<void> {
    await this.pushOperation({
      type: OperationType.Delete,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [`${field}.${name}`]: FieldValue.delete(),
      })
    })
  }
  public async union(field: DataKeys, elements: Array<unknown>): Promise<void> {
    await this.pushOperation({
      type: OperationType.Update,
      ref: this.ref,
      data: {
        [field]: FieldValue.arrayUnion(...elements)
      }
    })
  }
  public async remove(field: DataKeys, elements: Array<unknown>): Promise<void> {
    await this.pushOperation({
      type: OperationType.Update,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [field]: FieldValue.arrayRemove(...elements)
      })
    })
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

export default FirebaseAction
