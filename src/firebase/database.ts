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
} from 'firebase-admin/firestore'
import serviceAccount from './serviceaccount.js'
import {
  getStorage
} from 'firebase-admin/storage'

export const app: App = initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
  storageBucket: `${serviceAccount.project_id}.appspot.com`
})
export const bucket = getStorage().bucket()
const db: Firestore = getFirestore(app)

export interface DatabaseInterface {
  collection: CollectionReference
  doc: DocumentReference<DocumentData, DocumentData>

  pathToCollection: (collection: string) => CollectionReference
  pathToDoc: (name: string) => DocumentReference
  createDoc: (name: string, data?: object) => Promise<DocumentReference>
  write: (data: object) => Promise<this>
}

const Database = class DatabaseInterface {
  public collection: CollectionReference
  private doc: DocumentReference
  constructor() {
    this.collection = null
    this.doc = null
  }
  public pathToCollection(collection: string): CollectionReference {
    this.collection = db.collection(collection)
    return this.collection
  }
  public pathToDoc(name: string): DocumentReference {
    this.doc = this.collection.doc(name)
    return this.doc
  }
  public async createDoc(name: string, data: object = {}): Promise<DocumentReference> {
    // Return a promise so we don't fall behind with awaits
    return new Promise(async (resolve, reject): Promise<void> => {
      try {
        if (!this.collection) throw new Error('Collection has not been set.')

        let doc: DocumentReference = this.collection.doc(name)
        await doc.set(data)
        resolve(doc)
      } catch (err) {
        reject(err)
      }
    })
  }
  public async write(data: object): Promise<this> {
    // Return a promise so we don't fall behind with awaits
    return new Promise(async (resolve, reject): Promise<void> => {
      try {
        await this.doc.update(data)
        resolve(this)
      } catch (err) {
        reject(err)
      }
    })
  }
}

export const database = new Database()
