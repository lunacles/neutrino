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
  DocumentData,
} from 'firebase-admin/firestore'
import serviceAccount from './serviceaccount.js'
import {
  getStorage,
} from 'firebase-admin/storage'
import Log from '../utilities/log.js'
import * as util from '../utilities/util.js'

export const app: App = initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
  storageBucket: `${serviceAccount.project_id}.appspot.com`
})
export const bucket = getStorage().bucket()
export const db: Firestore = getFirestore(app)

export interface DatabaseInterface {
  collection: CollectionReference

  cd: (dir: string) => this
  mkdir: (name: string, data?: object) => Promise<DocumentReference>
  cat: (name?: string) => Promise<DocumentSnapshot | DocumentReference>
  write: (data: object) => Promise<this>
}

export const Database = class DatabaseInterface {
  static users: Map<string, DocumentData> = new Map()
  public collection: CollectionReference
  private doc: DocumentReference
  private path: string
  private homeDir: string
  constructor() {
    this.collection = null
    this.doc = null
    this.path = ''
    this.homeDir = 'users'

    this.cd('~')
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
      await doc.set(util.structureData(data))
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
  public async write(data: object): Promise<this> {
    try {
      if (!this.doc) throw new Error('Doc has not been concatenated.')

      await this.doc.update(util.structureData(data))
    } catch (err) {
      Log.error(`Filed to write data to document "${this.doc}" at path "${this.path}"`, err)
    }
    return this
  }
}
