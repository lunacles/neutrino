import {
  Client,
  Message,
  User,
  GuildMember,
  Events,
} from 'discord.js'
import {
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore'
import Observer from '../interface.js'
import {
  database,
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

  createUserDoc: () => Promise<void>
  logMessage: () => Promise<void>
}

const Task = class TaskInterface {
  public author: User
  private guildAuthor: GuildMember
  private message: Message
  constructor(author: User, guildAuthor: GuildMember, message: Message) {
    this.author = author
    this.guildAuthor = guildAuthor
    this.message = message
  }
  public async createUserDoc(): Promise<void> {
    let url: string
    let extension = (url: string): string => url.match(/\.([0-9a-z]+)(?:[\?#]|$)/i)[0] ?? 'png'

    // avatar/banner storage
    storage.cd(`~/${this.author.id}/avatars/global`)
    let globalAvatarURL: string = null
    url = this.author.displayAvatarURL()
    if (global.loggingConfig.avatars)
      globalAvatarURL = await storage.upload(url, `global_${Timestamp.now().seconds.toString()}.${extension(url)}`)

    storage.cd(`../guilds/${this.message.guild.id}`)
    let guildAvatarURL: string = null
    url = this.guildAuthor.avatarURL()
    if (global.loggingConfig.avatars && url && url !== this.author.avatarURL())
      guildAvatarURL = await storage.upload(url, `guild_${Timestamp.now().seconds.toString()}.${extension(url)}`)

    storage.cd(`~/${this.author.id}/banners/global`)
    let globalBannerURL: string = null
    url = this.author.bannerURL()
    if (global.loggingConfig.banners && url)
      globalBannerURL = await storage.upload(url, `global_${Timestamp.now().seconds.toString()}.${extension(url)}`)

    /* discord.js v14 for some reason doesn't allow you to get user server banners lol
    storage.cd(`../guilds/${this.message.guild.id}`)
    let guildBannerURL: string = null
    url = this.guildAuthor.bannerURL()
    if (global.loggingConfig.banners && url !== this.author.bannerURL())
      guildBannerURL = await storage.upload(url, `guild_${Timestamp.now().seconds.toString()}.${extension(url)}`)
    */

    // main doc & user info
    await database.mkdir(this.author.id, parseData({
      id: this.author.id,
      creationDate: Timestamp.fromDate(this.author.createdAt),
      username: this.author.username,
      presence: this.guildAuthor.presence,
      displayName: this.author.displayName,
      avatar: globalAvatarURL,
      banner: globalBannerURL,
      avatarDecoration: this.author.avatarDecorationURL(),
    } satisfies UserInfo))

    // logs collection
    database.cd(`${this.author.id}/logs`)

    await database.mkdir('presence', parseData(global.loggingConfig.presence ? {
      log: [{
        presence: this.guildAuthor.presence,
        guildsSeenIn: [this.message.guild.id],
        timestamp: Timestamp.now()
      } satisfies PresenceLog],
    } : {}))
    await database.mkdir('usernames', parseData(global.loggingConfig.usernames ? {
      log: [{
        name: this.author.username,
        timestamp: Timestamp.now(),
      } satisfies NameLog],
    } : {}))
    await database.mkdir('displayNames', parseData(global.loggingConfig.displayNames ? {
      log: [{
        name: this.author.displayName,
        timestamp: Timestamp.now(),
      } satisfies NameLog],
   } : {}))
    await database.mkdir('avatars', parseData(global.loggingConfig.avatars ? {
      log: [{
        avatar: globalAvatarURL,
        timestamp: Timestamp.now(),
      } satisfies AvatarLog],
    } : {}))
    await database.mkdir('banners', parseData(global.loggingConfig.banners ? {
      log: [{
        banner: globalBannerURL,
        timestamp: Timestamp.now(),
      } satisfies BannerLog],
    } : {}))

    database.cd('../guilds')
    // server logs collection
    await database.mkdir(this.message.guild.id, parseData(global.loggingConfig.servers ? {
      avatars: global.loggingConfig.avatars ? [{
        avatar: guildAvatarURL,
        timestamp: Timestamp.now(),
      } satisfies AvatarLog] : [],
      messages: [],
      nicknames: global.loggingConfig.nicknames ? [{
        name: this.guildAuthor.nickname,
        timestamp: Timestamp.now(),
      } satisfies NameLog] : {},
    } : {}))
  }
  public async logMessage(): Promise<void> {
    // collect attachments
    let attachmentURLs: Array<string> = []
    for (let attachment of this.message.attachments.values())
      attachmentURLs.push(await storage.upload(attachment.url))

    // collect linked attachments
    for (let embed of this.message.embeds.values()) {
      if (!embed.data.url.includes('tenor.com/view/') && !embed.data.url.includes('cdn.discordapp.com')) continue
      if (embed.data.video)
        attachmentURLs.push(await storage.upload(embed.data.video.url))
      if (embed.data.image)
        attachmentURLs.push(await storage.upload(embed.data.image.url))
    }

    // path to the user's storage file
    storage.cd(`~/${this.author.id}/servers/${this.message.guild.id}/messages/${this.message.id}`)

    // add the message to their userLog
    if (global.loggingConfig.messages) {
      await database.write({
        [`servers.${this.message.guild.id}.messageLog`]: FieldValue.arrayUnion(parseData({
          content: this.message.content,
          attachments: attachmentURLs,
          timestamp: Timestamp.fromMillis(this.message.createdTimestamp),
          link: this.message.url,
        } satisfies MessageLog))
      })
      Log.info(`Logging user ${this.author.id}'s message in guild ${this.message.guild.id}`)
    }
  }
}

const MessageCreate: Observer = {
  eventID: Events.MessageCreate,
  active: false,
  async react(bot: Client, message: Message): Promise<void> {
    const task = new Task(
      await bot.users.fetch(message.author.id, { force: true }),
      await message.guild.members.fetch(message.author.id),
      message,
    )

    // if the user is a bot, ignore them
    if (task.author.bot) return

    // path to the users document
    database.cd('~')

    // if they don't already exist in the database, add them
    if (await database.cat(task.author.id) == null) {
      Log.info(`Creating document for user with id "${task.author.id}"`)
      await task.createUserDoc()
    }

    // log the message if we want to
    if (global.loggingConfig.messages)
      await task.logMessage()
  }
}

export default MessageCreate
