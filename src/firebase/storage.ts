
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
  bucket,
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
    }, [] satisfies Array<string>)
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
  public async upload(url: string, fileName?: string): Promise<string> {
    try {
      let buffer: Buffer = await this.fetch(url)
      let file: File = this.storage.file(`${this.path}/${fileName ?? url.match(/([^\/?]+)(?=\?|$)/)[0]}`)
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
