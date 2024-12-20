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
} from 'firebase-admin/firestore'
import serviceAccount from './serviceaccount.js'
import {
  getStorage,
} from 'firebase-admin/storage'
import Log from '../../utilities/log.js'
import { Collection } from 'discord.js'

const app: App = initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
  storageBucket: `${serviceAccount.project_id}.appspot.com`
})
export const bucket = getStorage().bucket()
const db: Firestore = getFirestore(app)
db.settings({
  ignoreUndefinedProperties: true
})
export const FirebaseDatabase = class implements FirebaseDatabaseInterface {
  static batchWrite(operations: any): Promise<Array<WriteResult>> {
    let batch: WriteBatch = db.batch()

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
  static structureData(data: unknown): any {
    // direct return for non-object/non-array data types
    if (typeof data !== 'object' || data === null) return data

    // preserve firestore FieldValue instances
    if (data instanceof FieldValue) return data
    // preserve Timestamps
    if (data instanceof Timestamp) return data

    // handling for Arrays
    if (Array.isArray(data)) return data.map(item => FirebaseDatabase.structureData(item))

    // handling for Maps and Objects
    let entries: Array<[string, unknown]> = data instanceof Map || data instanceof Collection ? Array.from(data.entries()) : Object.entries(data)
    let result: object = Object.fromEntries(entries.map(([key, value]) => [key, FirebaseDatabase.structureData(value)]))
    return result
  }
  public collection: CollectionReference
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
  public cd(dir: string): this {
    if (dir.startsWith('/')) {
      this.path = this.normalizePath(dir)
    } else if (dir.startsWith('~/') || dir === '~') {
      this.path = this.normalizePath(this.homeDir + dir.slice(1, dir.length))
    } else {
      this.path = this.normalizePath(this.path + '/' + dir)
    }
    this.collection = db.collection(this.path)

    return this
  }
  public async mkdir(name: string, data: object = {}): Promise<DocumentReference> {
    try {
      if (!this.collection) throw new Error('Collection has not been set.')

      let doc: DocumentReference = this.collection.doc(name)
      await doc.set(FirebaseDatabase.structureData(data))
      this.doc = doc
      return doc
    } catch (err) {
      Log.error(`Failed to make new directory "${name}" at path "${this.path}"`, err)
    }
  }
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
  public async write(data: object): Promise<this> {
    try {
      if (!this.doc) throw new Error('Doc has not been concatenated.')

      await this.doc.update(FirebaseDatabase.structureData(data))
    } catch (err) {
      Log.error(`Filed to write data to document "${this.doc}" at path "${this.path}"`, err)
    }
    return this
  }
  public async rm(name?: string): Promise<this> {
    try {
      if (!this.doc) throw new Error('No doc found.')

      let doc: DocumentReference = this.collection.doc(name)
      await doc.delete()
    } catch (err) {
      Log.error(`Filed to delete document "${this.doc}" at path "${this.path}"`, err)
    }
    return this
  }
}
