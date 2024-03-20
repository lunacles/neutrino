import {
  initializeApp,
  cert,
  App,
} from 'firebase-admin/app'
import {
	getFirestore,
  //Timestamp,
  //FieldValue,
  //Filter,
  Firestore,
  CollectionReference,
  DocumentReference,
  DocumentData,
} from 'firebase-admin/firestore'

//import config from './config.js'
//import Log from '../utilities/log.js'
import serviceAccount from './serviceaccount.js'
//import UserDoc from './storage.js'

const app: App = initializeApp({
  credential: cert(serviceAccount)
})
//initializeApp(config)
const db: Firestore = getFirestore(app)

interface DatabaseInterface {
  collection: CollectionReference
  doc: DocumentReference<DocumentData, DocumentData>

  pathToCollection: (collection: string) => CollectionReference
  pathToDoc: (name: string) => DocumentReference
  createDoc: (name: string, data?: object) => Promise<DocumentReference>
  write: (data: object) => Promise<this>
}
//Timestamp.fromDate(new Date('December 10, 1815'))
const Database = class DatabaseInterface {
  private collection: CollectionReference
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

const database = new Database()
database.pathToCollection('users')
export default database
