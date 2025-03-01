import {
  initializeApp,
  cert,
  App,
  ServiceAccount,
} from 'firebase-admin/app'
import {
	getFirestore,
  Firestore,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  WriteBatch,
  WriteResult,
  Timestamp,
  FieldValue,
  Query,
} from 'firebase-admin/firestore'
import Log from '../../utilities/log.js'
import { Collection } from 'discord.js'

const serviceAccount = structuredClone((await import(`../../../${process.env.NODE_ENV.toLowerCase()}-serviceaccount.json`, {
  assert: { type: 'json' }
})).default)

export const initApp = async (): Promise<Firestore> => {
  // Initialize the app with our credentials
  const app: App = initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
    storageBucket: `${serviceAccount.project_id}.appspot.com`
  })

  // Get the db
  const database = getFirestore(app)
  // Apply our settings
  database.settings({
    ignoreUndefinedProperties: true
  })

  return database
}

export const FirebaseDatabase = class implements FirebaseDatabaseInterface {
  public static database: Firestore

  // Write a batch to the database
  static batchWrite(operations: any): Promise<Array<WriteResult>> {
    let batch: WriteBatch = FirebaseDatabase.database.batch()

    for (let { type, ref, data } of operations) {
      switch (type) {
        case 'set':
          batch.set(ref, data)
          break
        case 'update':
          batch.update(ref, data)
          break
        case 'delete':
          batch.delete(ref)
          break
        default:
          throw new Error(`Unsupported batch operation type: ${type}`)
      }
    }

    return batch.commit()
  }
  // Structure our data for the database
  static structureData(data: unknown): any {
    // Direct return for non-object/non-array data types
    if (typeof data !== 'object' || data === null) return data

    // Preserve firestore FieldValue instances
    if (data instanceof FieldValue) return data
    // Preserve Timestamps
    if (data instanceof Timestamp) return data

    // Handling for arrays
    if (Array.isArray(data)) return data.map(item => FirebaseDatabase.structureData(item))

    // Handling for Maps and Objects
    // Like I get why this is necessary for classes like Maps and Sets
    // But like why tf do you have to make the user do it
    let entries: Array<[string, unknown]> = data instanceof Map || data instanceof Collection ? Array.from(data.entries()) : Object.entries(data)
    let result: object = Object.fromEntries(entries.map(([key, value]) => [key, FirebaseDatabase.structureData(value)]))
    return result
  }
  public collection: CollectionReference<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData>
  public doc: DocumentReference
  private path: string
  private homeDir: string
  constructor(homeDir: string = 'users') {
    this.collection = null
    this.doc = null
    this.path = ''
    this.homeDir = homeDir

    this.cd('~/')
  }
  // Normalize the given path
  private normalizePath(path: string): string {
    let parts: Array<string> = path.split('/').reduce((acc: Array<string>, cur: string) => {
      if (cur === '..') {
        acc.pop()
      } else if (cur !== '.' && cur !== '') {
        acc.push(cur)
      }
      return acc
    }, [] as Array<string>)
    return parts.join('/')
  }
  // Change the current directory
  public cd(dir: string): this {
    if (dir.startsWith('/')) {
      this.path = this.normalizePath(dir)
    } else if (dir.startsWith('~/') || dir === '~') {
      this.path = this.normalizePath(this.homeDir + dir.slice(1, dir.length))
    } else {
      this.path = this.normalizePath(this.path + '/' + dir)
    }

    this.collection = FirebaseDatabase.database.collection(this.path)

    return this
  }
  // Make a new directory
  public async touch(name: string, data: object = {}): Promise<DocumentReference> {
    try {
      if (!this.collection) throw new Error('Collection has not been set.')

      let doc: DocumentReference = this.collection.doc(name)
      await doc.set(FirebaseDatabase.structureData(data))
      this.doc = doc
      return doc
    } catch (err) {
      Log.error(`Failed to make new file "${name}" at path "${this.path}"`, err)
    }
  }
  // Concatenate a file for reading and writing purposes
  public async cat(name?: string): Promise<DocumentSnapshot | DocumentReference> {
    try {
      if (!this.collection) throw new Error('Collection has not been set.')

      let doc = this.collection.doc(name ?? /[^/]+$/.exec(this.path)[0])
      let data = await doc.get()
      if (!data.exists) throw new ReferenceError('Requested document doesn\'t exist')
      this.doc = doc
      return data
    } catch (err) {
      Log.error(`Requested document "${name}" at path "${this.path}" does not exist`, err)
      return null
    }
  }
  // Get a doc
  public getdoc(name: string): DocumentReference {
    try {
      if (!this.collection) throw new Error('Collection has not been set.')

      let doc = this.collection.doc(name ?? /[^/]+$/.exec(this.path)[0])
      this.doc = doc
      return this.doc
    } catch (err) {
      Log.error(`Requested document "${name}" at path "${this.path}" does not exist`, err)
      return null
    }
  }
  // Write to a doc
  // Wait, is this even necessary?
  // nvm we might need to directly write instead of use a batch
  public async write(data: object): Promise<this> {
    try {
      if (!this.doc) throw new Error('Doc has not been concatenated.')

      await this.doc.update(FirebaseDatabase.structureData(data))
    } catch (err) {
      Log.error(`Filed to write data to document "${this.doc}" at path "${this.path}"`, err)
    }
    return this
  }
  // Remove a doc
  public async rm(name?: string): Promise<this> {
    try {
      this.doc ??= this.collection.doc(name)
      if (!this.doc) throw new Error('No doc found.')

      await this.doc.delete()
      this.doc = null
    } catch (err) {
      Log.error(`Filed to delete document "${this.doc}" at path "${this.path}"`, err)
    }
    return this
  }
  // Query for data
  public async query({
    field,
    orderBy = null,
    limit = null,
    startAt = null,
    startAfter = null,
    endAt = null,
    endBefore = null,
    comparator = null,
    operand = null,
  }: QueryInterface): Promise<Snapshot> {
    try {
      let query: Query = this.collection

      // I fucking hate this
      if (field && comparator && operand)
        query = query.where(field, comparator, operand)
      if (field && orderBy)
        query = query.orderBy(field, orderBy)
      if (limit)
        query = query.limit(limit)
      if (startAt)
        query = query.startAt(startAt)
      if (startAfter)
        query = query.startAfter(startAfter)
      if (endAt)
        query = query.endAt(endAt)
      if (endBefore)
        query = query.endBefore(endBefore)

      return await query.get()
    } catch (err) {
      Log.error(`Failed to query documents from path "${this.path}"`, err)
    }
  }
}
