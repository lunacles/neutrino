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
  Timestamp
} from 'firebase-admin/firestore'
import Observer from '../interface.js'
import {
  database,
  DatabaseInterface,
} from '../../firebase/database.js'
import UserLogInterface from '../discord.js'

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
  console.log(result)

  return result
}


const MessageCreate: Observer = {
  eventID: Events.MessageCreate,
  active: false,
  async react(bot: Client, message: Message): Promise<void> {
    const guildAuthor: GuildMember = await message.guild.members.fetch(message.author.id)
    const author: User = await bot.users.fetch(message.author.id, { force: true })
    if (author.bot) return

    database.pathToCollection('users')
    let userDoc: DocumentSnapshot | DocumentReference = await database.pathToDoc(author.id).get()

    console.log(userDoc, userDoc.exists)
    if (!userDoc.exists) {
      let doc: UserLogInterface = {
        id: author.id,
        creationDate: Timestamp.fromDate(author.createdAt),
        presense: guildAuthor.presence,
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
        banner: author.banner,
        bannerLog: [{
          banner: author.bannerURL(),
          timestamp: Timestamp.now(),
        }],
        avatarDecoration: author.avatarDecorationURL()
      }
      userDoc = await (await database.createDoc(message.author.id, parseData(doc))).get()
    } else {

    }
    console.log(userDoc.data())
  }
}

export default MessageCreate
