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
  protected db: FirebaseDatabaseInterface
  public ref: DocumentReference
  constructor(doc: string, home: string, path?: string) {
    this.db = new FirebaseDatabase(home)
    this.ref = this.db.cd(`~/${path ?? ''}`).getdoc(doc)
  }
  // Push an operation to update a field
  protected async updateField(field: DataKeys, data: unknown): Promise<void> {
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
  protected async updateFieldValue(field: DataKeys, key: string, data: unknown): Promise<void> {
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
  protected async setField(field: DataKeys, data: unknown): Promise<void> {
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
  protected async setFieldValue(field: DataKeys, key: string, data: unknown): Promise<void> {
    await this.pushOperation({
      type: OperationType.Set,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [`${field}.${key}`]: data,
      })
    })
  }
  // Push an operation to remove a field
  protected async remove(field: DataKeys, elements: Array<unknown>): Promise<void> {
    await this.pushOperation({
      type: OperationType.Update,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [field]: FieldValue.arrayRemove(...elements)
      })
    })
  }
  // Push an operation to remove a nested field
  protected async removeFieldValue(field: DataKeys, name: string): Promise<void> {
    await this.pushOperation({
      type: OperationType.Delete,
      ref: this.ref,
      data: FirebaseDatabase.structureData({
        [`${field}.${name}`]: FieldValue.delete(),
      })
    })
  }
  // Push an operation to unionize arrays
  protected async union(field: DataKeys, elements: Array<unknown>): Promise<void> {
    await this.pushOperation({
      type: OperationType.Update,
      ref: this.ref,
      data: {
        [field]: FieldValue.arrayUnion(...elements)
      }
    })
  }
  // Push an operation to the batch
  protected async pushOperation(operation: OperationInterface): Promise<this> {
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
  protected async writeBatch(batch?: Array<OperationInterface>): Promise<this> {
    await FirebaseDatabase.batchWrite(batch ?? operations)
    return this
  }
}

export default FirebaseAction
