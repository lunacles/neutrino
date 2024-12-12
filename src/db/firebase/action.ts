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

// TODO: Wait wtf why is this global
// fix this shit asap
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
  // Push an operation to update a field
  public async updateField(field: DataKeys, data: unknown): Promise<void> {
    await this.pushOperation({
      type: OperationType.Update,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [field]: data
      })
    })
  }
  // Push an operation to update a nested field
  // TODO: add some support if it's nested more than twice
  // idk not really that important cuz you really shouldn't be nesting shit anyway lol
  public async updateFieldValue(field: DataKeys, key: string, data: unknown): Promise<void> {
    await this.pushOperation({
      type: OperationType.Update,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [`${field}.${key}`]: data,
      })
    })
  }
  // Push an operation to set a field
  // Shouldn't be used like ever unless you add a new value to the dataset
  // In that case just use this the next time the doc is fetched
  public async setField(field: DataKeys, data: unknown): Promise<void> {
    await this.pushOperation({
      type: OperationType.Set,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [field]: data
      })
    })
  }
 // Push an operation to set a nested field
  // TODO: add some support if it's nested more than twice
  // Shouldn't be used like ever unless you add a new value to the dataset
  // In that case just use this the next time the doc is fetched
  public async setFieldValue(field: DataKeys, key: string, data: unknown): Promise<void> {
    await this.pushOperation({
      type: OperationType.Set,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [`${field}.${key}`]: data,
      })
    })
  }
  // Push an operation to remove a field
  public async remove(field: DataKeys, elements: Array<unknown>): Promise<void> {
    await this.pushOperation({
      type: OperationType.Update,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [field]: FieldValue.arrayRemove(...elements)
      })
    })
  }
  // Push an operation to remove a nested field
  public async removeFieldValue(field: DataKeys, name: string): Promise<void> {
    await this.pushOperation({
      type: OperationType.Delete,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [`${field}.${name}`]: FieldValue.delete(),
      })
    })
  }
  // Push an operation to unionize arrays
  public async union(field: DataKeys, elements: Array<unknown>): Promise<void> {
    await this.pushOperation({
      type: OperationType.Update,
      ref: this.ref,
      data: {
        [field]: FieldValue.arrayUnion(...elements)
      }
    })
  }
  // Push an operation to the batch
  private async pushOperation(operation: OperationInterface): Promise<this> {
    operations.push(operation)
    // TODO: Make the amount for a push more dynamic depending on other factors
    // e.g. currently stress on the server, chat activity, etc.
    if (operations.length > 5) {
      await this.writeBatch(operations)
      operations = []
    }
    return this
  }
  // Push a write batch to the database
  public async writeBatch(batch?: Array<OperationInterface>): Promise<this> {
    await FirebaseDatabase.batchWrite(batch ?? operations)
    return this
  }
}

export default FirebaseAction
