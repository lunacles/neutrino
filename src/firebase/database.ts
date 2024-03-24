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
  DocumentData,
  DocumentSnapshot,
} from 'firebase-admin/firestore'
import serviceAccount from './serviceaccount.js'
import {
  getStorage
} from 'firebase-admin/storage'
import Log from '../utilities/log.js'

export const app: App = initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
  storageBucket: `${serviceAccount.project_id}.appspot.com`
})
export const bucket = getStorage().bucket()
const db: Firestore = getFirestore(app)

export interface DatabaseInterface {
  collection: CollectionReference
  doc: DocumentReference<DocumentData, DocumentData>
  path: string
  homeDir: string

  cd: (dir: string) => this
  mkdir: (name: string, data?: object) => Promise<DocumentReference>
  pathToDoc: (name: string) => DocumentReference
  write: (data: object) => Promise<this>
}

const Database = class DatabaseInterface {
  public collection: CollectionReference
  private doc: DocumentReference
  private path: string
  private homeDir: string
  constructor() {
    this.collection = null
    this.doc = null
    this.path = ''
    this.homeDir = 'users'
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
  public cd(dir: string, collect: boolean = true): this {
    if (dir.startsWith('/')) {
      this.path = this.normalizePath(dir)
    } else if (dir.startsWith('~')) {
      this.path = this.normalizePath(this.homeDir + dir.slice(1, dir.length))
    } else {
      this.path = this.normalizePath(this.path + '/' + dir)
    }
    if (collect)
      this.collection = db.collection(this.path)

    return this
  }
  public async mkdir(name: string, data: object = {}): Promise<DocumentReference> {
    try {
      if (!this.collection) throw new Error('Collection has not been set.')

      let doc: DocumentReference = this.collection.doc(name)
      await doc.set(structuredClone(data))
      this.doc = doc
      return doc
    } catch (err) {
      Log.error(`Failed to make new directory "${name}" at path "${this.path}"`, err)
    }
  }
  public async cat(name?: string): Promise<DocumentSnapshot | DocumentReference> {
    try {
      if (!this.collection) throw new Error('Collection has not been set.')

      let doc = await this.collection.doc(name ?? /[^/]+$/.exec(this.path)[0]).get()
      if (!doc.exists) throw new ReferenceError()
      return doc
    } catch (err) {
      Log.error(`Requested document "${name}" at path "${this.path}" does not exist`, err)
      return null
    }
  }
  public async write(data: object): Promise<this> {
    try {
      if (!this.doc) throw new Error('Doc has not been concatenated.')

      await this.doc.update(data)
    } catch (err) {
      Log.error(`Filed to write data to document "${name}" at path "${this.path}"`, err)
    }
    return this
  }
}

export const database = new Database()
