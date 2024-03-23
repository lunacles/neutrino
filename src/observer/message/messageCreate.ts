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
import UserLogInterface from '../discord.js'
import Log from '../../utilities/log.js'

const parseData = (data: any): any => {
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

const MessageCreate: Observer = {
  eventID: Events.MessageCreate,
  active: false,
  async react(bot: Client, message: Message): Promise<void> {
    const guildAuthor: GuildMember = await message.guild.members.fetch(message.author.id)
    const author: User = await bot.users.fetch(message.author.id, { force: true })
    // if the user is a bot, ignore them
    if (author.bot) return

    // path to the user's file
    storage.cd('~').cd(`${author.id}/servers/${message.guild.id}/messages/${message.id}`)
    let attachmentURLs: Array<string> = []
    for (let attachment of message.attachments.values())
      attachmentURLs.push(await storage.upload(attachment.url))

    for (let embed of message.embeds.values()) {
      if (!embed.data.url.includes('tenor.com/view/') && !embed.data.url.includes('cdn.discordapp.com')) continue
      if (embed.data.video)
        attachmentURLs.push(await storage.upload(embed.data.video.url))
      if (embed.data.image)
        attachmentURLs.push(await storage.upload(embed.data.image.url))
    }
    database.pathToCollection('users')
    let userDoc: DocumentSnapshot | DocumentReference = await database.pathToDoc(author.id).get()

    if (!userDoc.exists) {
      let doc: UserLogInterface = {
        id: author.id,
        creationDate: Timestamp.fromDate(author.createdAt),
        presence: guildAuthor.presence,
        presenceLogs: [{
          presence: guildAuthor.presence,
          guildsSeenIn: [message.guild.id],
          timestamp: Timestamp.now()
        }],
        servers: new Map().set(message.guild.id, {
          nickname: guildAuthor.nickname,
          avatar: guildAuthor.avatarURL(),
          joined: guildAuthor.joinedTimestamp,
          avatarLog: [{
            avatar: guildAuthor.avatarURL(),
            timestamp: Timestamp.now(),
          }],
          messageLog: [{
            content: message.content,
            attachments: attachmentURLs,
            timestamp: Timestamp.fromMillis(message.createdTimestamp),
            link: message.url,
          }],
          nicknameLog: [{
            name: guildAuthor.nickname,
            timestamp: Timestamp.now()
          }]
        }),
        username: author.username,
        usernameLog: [{
          value: author.username,
          timestamp: Timestamp.now(),
        }],
        displayName: author.displayName,
        displayNameLog: [{
          value: author.displayName,
          timestamp: Timestamp.now(),
        }],
        avatar: author.avatarURL(),
        avatarLog: [{
          avatar: author.avatarURL(),
          timestamp: Timestamp.now(),
        }],
        banner: author.bannerURL() ? author.bannerURL() : null,
        bannerLog: [{
          banner: author.bannerURL() ? author.bannerURL() : null,
          timestamp: Timestamp.now(),
        }],
        avatarDecoration: author.avatarDecorationURL()
      }
      userDoc = await (await database.createDoc(message.author.id, parseData(doc))).get()
    } else {
      await database.write({
        [`servers.${message.guild.id}.messageLog`]: FieldValue.arrayUnion(parseData({
          content: message.content,
          attachments: attachmentURLs,
          timestamp: Timestamp.fromMillis(message.createdTimestamp),
          link: message.url,
        }))
      })
      Log.info(`Logging user ${author.id}'s message in guild ${message.guild.id}`)
    }
  }
}

export default MessageCreate
