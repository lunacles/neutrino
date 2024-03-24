import {
  Client,
  Message,
  User,
  GuildMember,
  Events,
} from 'discord.js'
import {
  DocumentReference,
  DocumentSnapshot,
  FieldValue,
  Timestamp
} from 'firebase-admin/firestore'
import Observer from '../interface.js'
import {
  database
} from '../../firebase/database.js'
import storage from '../../firebase/storage.js'
import {
  MessageLog,
  AvatarLog,
  BannerLog,
  NameLog,
  PresenceLog,
  UserInfo,
} from '../datainterface.js'

import Log from '../../utilities/log.js'
import global from '../../global.js'

const parseData = (data: any): any => {
  // TODO: Fix bug that causes stack overflow on message replies

  // direct return for non-object/non-array data types
  if (typeof data !== 'object' || data === null) return data
  // special handling for Timestamps
  if (data instanceof Timestamp) return data
  // handling for Arrays
  if (Array.isArray(data)) return data.map(item => parseData(item))
  // handling for Maps and Objects
  let entries: Array<[string, unknown]> = data instanceof Map ? Array.from(data.entries()) : Object.entries(data)
  let result: object = Object.fromEntries(entries.map(([key, value]) => [key, parseData(value)]))
  return result
}

interface TaskInterface {
  author: User
  guildAuthor: GuildMember
  message: Message
  userDoc: DocumentSnapshot | DocumentReference
  attachmentURLs: Array<string>

  createUserDoc: () => Promise<void>
  logMessage: () => Promise<void>
}

const Task: TaskInterface = {
  author: null,
  guildAuthor: null,
  message: null,
  userDoc: null,
  attachmentURLs: [],
  async createUserDoc(): Promise<void> {
    // main doc & user info
    await database.mkdir(this.author.id, parseData({
      id: this.author.id,
      creationDate: Timestamp.fromDate(this.author.createdAt),
      username: this.author.username,
      presence: this.guildAuthor.presence,
      displayName: this.author.displayName,
      avatar: this.author.avatarURL(),
      banner: this.author.bannerURL(),
      avatarDecoration: this.author.avatarDecorationURL(),
    } as UserInfo))

    // logs collection
    database.cd(`${this.author.id}/logs`)

    await database.mkdir('presence', parseData(global.loggingConfig.presence ? {
      log: [{
        presence: this.guildAuthor.presence,
        guildsSeenIn: [this.message.guild.id],
        timestamp: Timestamp.now()
      } as PresenceLog]
    } : {}))
    await database.mkdir('usernames', parseData(global.loggingConfig.usernames ? {
      log: [{
        name: this.author.username,
        timestamp: Timestamp.now(),
      } as NameLog]
    } : {}))
    await database.mkdir('displayNames', parseData(global.loggingConfig.displayNames ? {
      log: [{
      name: this.author.displayName,
      timestamp: Timestamp.now(),
    } as NameLog]
   } : {}))
    await database.mkdir('avatars', parseData(global.loggingConfig.avatars ? {
      log: [{
        avatar: this.author.avatarURL(),
        timestamp: Timestamp.now(),
      } as AvatarLog]
    } : {}))
    await database.mkdir('banners', parseData(global.loggingConfig.banners ? {
      log: [{
        banner: this.author.bannerURL() ? this.author.bannerURL() : null,
        timestamp: Timestamp.now(),
      } as BannerLog]
    } : {}))

    // server logs collection
    await database.mkdir('servers', parseData(global.loggingConfig.servers ? {
      avatars: global.loggingConfig.avatars ? [{
        avatar: this.guildAuthor.avatarURL(),
        timestamp: Timestamp.now(),
      } as AvatarLog] : [],
      messages: global.loggingConfig.messages ? [{
        content: this.message.content,
        attachments: this.attachmentURLs,
        timestamp: Timestamp.fromMillis(this.message.createdTimestamp),
        link: this.message.url,
      } as MessageLog] : [],
      nicknames: global.loggingConfig.nicknames ? [{
        name: this.guildAuthor.nickname,
        timestamp: Timestamp.now()
      } as NameLog] : {}
    } : {}))
  },
  async logMessage(): Promise<void> {
    // path to the user's storage file
    storage.cd(`~/${this.author.id}/servers/${this.message.guild.id}/messages/${this.message.id}`)

    // add the message to their userLog
    if (global.loggingConfig.messages) {
      await database.write({
        [`servers.${this.message.guild.id}.messageLog`]: FieldValue.arrayUnion(parseData({
          content: this.message.content,
          attachments: this.attachmentURLs,
          timestamp: Timestamp.fromMillis(this.message.createdTimestamp),
          link: this.message.url,
        }))
      })
      Log.info(`Logging user ${this.author.id}'s message in guild ${this.message.guild.id}`)
    }
  }
}

const MessageCreate: Observer = {
  eventID: Events.MessageCreate,
  active: false,
  async react(bot: Client, message: Message): Promise<void> {
    Task.guildAuthor = await message.guild.members.fetch(message.author.id)
    Task.author = await bot.users.fetch(message.author.id, { force: true })
    Task.message = message

    // collect attachments
    for (let attachment of message.attachments.values())
      Task.attachmentURLs.push(await storage.upload(attachment.url))

    // collect linked attachments
    for (let embed of message.embeds.values()) {
      if (!embed.data.url.includes('tenor.com/view/') && !embed.data.url.includes('cdn.discordapp.com')) continue
      if (embed.data.video)
        Task.attachmentURLs.push(await storage.upload(embed.data.video.url))
      if (embed.data.image)
        Task.attachmentURLs.push(await storage.upload(embed.data.image.url))
    }

    // if the user is a bot, ignore them
    if (Task.author.bot) return

    // path to the users document
    database.cd('~')

    // if they don't already exist in the database, add them
    if (await database.cat(Task.author.id) == null)
      await Task.createUserDoc()
  }
}

export default MessageCreate
