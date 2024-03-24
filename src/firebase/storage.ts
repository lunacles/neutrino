
import {
  getDownloadURL,
} from 'firebase-admin/storage'
import https from 'https'
import {
  Bucket,
  File,
} from '@google-cloud/storage'
import Log from '../utilities/log'
import {
  bucket
} from './database.js'

const FireStorage = class {
  private storage: Bucket
  public path: string
  private homeDir: string
  constructor(storage: Bucket) {
    this.storage = storage
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
  public cd(path: string): this {
    if (path.startsWith('/')) {
      this.path = this.normalizePath(path)
    } else if (path.startsWith('~')) {
      this.path = this.homeDir
    } else {
      this.path = this.normalizePath(this.path + '/' + path)
    }
    return this
  }
  public pathTo(path: string): this {
    this.path = path
    return this
  }
  private fetch(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        if (res.statusCode === 200) {
          let chunks: Array<any> = []
          res.on('data', (chunk: object): number => chunks.push(chunk))
          res.on('end', (): void => resolve(Buffer.concat(chunks)))
        } else {
          reject(`Failed to download the file. Status code: ${res.statusCode}`)
        }
      }).on('error', (err: Error) => {
        reject(`Got error: ${err.message}`)
      })
    })
  }
  private saveFile(file: File, buffer: Buffer): Promise<File> {
    return new Promise((resolve, reject) => {
      file.save(buffer, (err: Error) => {
        if (err) {
          reject(`Failed to save file: ${err.message}`)
        } else {
          resolve(file)
        }
      })
    })
  }
  public async upload(url: string): Promise<string> {
    let fileName: string = url.match(/([^\/?]+)(?=\?|$)/)[0];
    try {
      let buffer: Buffer = await this.fetch(url)
      let file: File = this.storage.file(`${this.path}/${fileName}`)
      await this.saveFile(file, buffer)

      let uri: string = await getDownloadURL(file)
      return uri
    } catch (err) {
      Log.error(`Operation failed: ${err}`)
      return ''
    }
  }
}

const storage = new FireStorage(bucket)

export default storage
