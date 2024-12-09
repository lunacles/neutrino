import fs from 'fs/promises'
import path from 'path'
import process from 'process'
import { authenticate } from '@google-cloud/local-auth'
import { gmail_v1, google } from 'googleapis'

import credentials from './credentials.js'
import { fileURLToPath } from 'url'
import Log from '../utilities/log.js'

type Token = {
  type: string
  client_id: string
  client_secret: string
  refresh_token: string
}

const GmailAPI = class {
  public static readonly SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly'
  ]
  public static readonly CREDENTIALS_PATH = path.join(process.cwd(), `/src/mail/${process.env.NODE_ENV.toLowerCase()}-mail-credentials.json`)

  public clients: Array<MailboxInterface>
  constructor() {
    this.clients = []
  }
  private async loadTokens(): Promise<Array<Token>> {
    try {
      let directory: string = path.join(path.dirname(fileURLToPath(import.meta.url)), 'tokens')
      let files: Array<string> = await fs.readdir(directory)

      return await Promise.all(files.map(async (file: string): Promise<Token> =>
        (await import(path.join(directory, file), {
          assert: { type: 'json' }
        })).default
      ))
    } catch (err) {
      Log.error('Failed to load tokens', err)
      return []
    }
  }
  private async saveCredentials(client: any): Promise<void> {
    const key = credentials.installed || credentials.web
    const payload: Token = {
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    }
    await fs.writeFile(path.join(process.cwd(), this.clients.length.toString()), JSON.stringify(payload))
    this.clients.push(new Mailbox(payload))
  }
  public async init(): Promise<this> {
    let client = credentials
    try {
      let tokens = await this.loadTokens()
      for (let token of tokens)
        this.clients.push(new Mailbox(token))
    } catch (err) {
      Log.error('Failed to use saved token, falling back to authentication', err)
    }

    // if no valid tokens are found, prompt for authentication
    if (!client) {
      client = await authenticate({
        scopes: GmailAPI.SCOPES,
        keyfilePath: GmailAPI.CREDENTIALS_PATH,
      })

      if (client.credentials)
        await this.saveCredentials(client)
    }

    return this
  }
}

interface MailboxInterface {
  fetchUnread(): Promise<Array<gmail_v1.Schema$Message>>
  fetchMessageData(id: string): Promise<gmail_v1.Schema$Message>
}

const Mailbox = class implements MailboxInterface {
  private readonly client: any
  private readonly gmail: gmail_v1.Gmail
  constructor(token: Token) {
    this.client = google.auth.fromJSON({
      ...credentials,
      ...token,
    })
    this.gmail = google.gmail({
      version: 'v1',
      auth: this.client
    })
  }
  public async fetchUnread(): Promise<Array<gmail_v1.Schema$Message>> {
    try {
      const res = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
      })
      return res.data.messages ?? []
    } catch (err) {
      Log.error('Failed to fetch unread messages', err)
      return []
    }
  }
  public async fetchMessageData(id: string): Promise<gmail_v1.Schema$Message> {
    try {
      const res = await this.gmail.users.messages.get({
        userId: 'me',
        id,
      })
      return res.data
    } catch (err) {
      Log.error(`Failed to fetch message data for ID ${id}`, err)
      return null
    }
  }
}

export default GmailAPI
