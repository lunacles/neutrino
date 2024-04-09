import {
  Message,
  User,
  GuildMember,
  Role,
  Guild,
  Activity,
  Collection,
} from 'discord.js'
import {
  DocumentData,
  DocumentReference,
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore'
import {
  Database,
  DatabaseInterface
} from './database.js'
import {
  MessageLog,
  AvatarLog,
  BannerLog,
  NameLog,
  PresenceLog,
  UserInfo,
  UserPresence,
  GuildRole,
  GuildData,
  UserActivity
} from './datainterface.js'

import Log from '../utilities/log.js'
import global from '../utilities/global.js'
import * as util from '../utilities/util.js'
import {
  FireStorage,
  FireStorageInterface,
} from './storage.js'
import bot from '../main.js'

interface GlobalLogsInterface {
  presence: () => Promise<void>
  username: () => Promise<void>
  displayName: () => Promise<void>
  avatar: (write: boolean) => Promise<void>
  banner: (write: boolean) => Promise<void>
}

interface GlobalInterface {
  avatarURL: string
  bannerURL: string
  presence: UserPresence

  setupMain: () => Promise<void>
  setupLogs: () => Promise<void>

  log: GlobalLogsInterface
}

interface GuildLogsInterface {
  message: (message: Message) => Promise<void>
  avatar: (guild: Guild, write: boolean) => Promise<void>
  banner: (guild: Guild, write: boolean) => Promise<void>
}

interface GuildInterface {
  avatarURL: string
  bannerURL: string

  setupGuildLogs: (guild: Guild) => Promise<void>

  log: GuildLogsInterface
}

interface OperationInterface {
  type: string
  ref: DocumentReference
  data: object
}

type Cooldown = 'score' | 'leaderboard' | 'claim' | 'steal' | 'gamble' | 'shield'

enum BaseScore {
  '878403773066784839' = 25,   // egg
  '839992302725234709' = 50,   // square
  '839992464831938580' = 100,  // triangle
  '839992547702734859' = 250,  // pentagon
  '839992638514004038' = 500,  // beta pentagon
  '839992726937534504' = 1e3,  // alpha pentagon
  '839992968869838849' = 2500, // gem
  '943590194278453274' = 5e3,  // jewel
  '1026052883768152145' = 1e4, // basic
}

const UserData = class {
  static async new(id: string, guild?: Guild) {
    let author: User = await bot.client.users.fetch(id, { force: true })
    return await new UserData(author).create(guild)
  }
  private operations: Array<OperationInterface>
  private storage: FireStorageInterface
  private database: DatabaseInterface
  public author: User
  private guildAuthor: GuildMember

  public global: GlobalInterface
  public guild: GuildInterface
  public misc: any
  public data: DocumentData
  constructor(author: User) {
    const self = this
    this.operations = []

    this.storage = new FireStorage()
    this.database = new Database()

    this.author = author
    this.guildAuthor = null

    this.data = {
      guilds: {}
    }

    this.global = {
      avatarURL: null,
      bannerURL: null,

      presence: {
        activities: null,
        status: null,
      },
      async setupMain(): Promise<void> {
        this.presence = {
          activities: self.guildAuthor.presence?.activities.map((activity: Activity) => ({
            id: activity.applicationId,
            timestamp: Timestamp.fromMillis(activity.createdTimestamp),
            emoji: {
              animated: activity.emoji?.animated ?? false,
              timestamp: Timestamp.fromMillis(activity.emoji?.createdTimestamp ?? 0),
              id: activity.emoji?.id ?? 'None',
              identifier: activity.emoji?.identifier ?? 'None',
              name: activity.emoji?.name ?? 'None',
              url: activity.emoji?.url ?? 'None',
            },
            assets: {
              largeImageURL: activity.assets?.largeImageURL() ?? 'None',
              largeText: activity.assets?.largeText ?? 'None',
              smallImageURL: activity.assets?.smallImageURL() ?? 'None',
              smallText: activity.assets?.smallText ?? 'None',
            },
            buttons: activity.buttons,
            details: activity.details,
            name: activity.name,
            party: activity.party,
            state: activity.state,
            type: activity.type,
            url: activity.url,
          } satisfies UserActivity)) ?? [],
          status: self.guildAuthor.presence?.status ?? 'Offline',
        } satisfies UserPresence

        await Promise.all([
          this.log.avatar(false),
          this.log.banner(false),
        ])

        let data: UserInfo = {
          id: self.author.id,
          creationDate: Timestamp.fromDate(self.author.createdAt),
          username: self.author.username,
          presence: this.presence,
          displayName: self.author.globalName,
          avatar: self.author.avatarURL(),
          banner: self.author.bannerURL(),
          avatarDecoration: self.author.avatarDecorationURL(),
        }


        self.operations.push({
          type: 'set',
          ref: self.database.cd('~/').getdoc(self.author.id),
          data: util.structureData(data),
        })

        self.data = data
      },
      async setupLogs(): Promise<void> {
        self.database.cd(`~/${self.author.id}/logs`)

        self.operations.push({
          type: 'set',
          ref: self.database.getdoc('presence'),
          data: util.structureData(global.loggingConfig.presence ? {
            log: [{
              presence: this.presence,
              guildsSeenIn: [self.guildAuthor.guild.id],
              timestamp: Timestamp.now()
            } satisfies PresenceLog],
          } : {}),
        } satisfies OperationInterface, {
          type: 'set',
          ref: self.database.getdoc('usernames'),
          data: util.structureData(global.loggingConfig.usernames ? {
            log: [{
              name: self.author.username,
              timestamp: Timestamp.now(),
            } satisfies NameLog],
          } : {}),
        } satisfies OperationInterface, {
          type: 'set',
          ref: self.database.getdoc('displayNames'),
          data: util.structureData(global.loggingConfig.displayNames ? {
            log: [{
              name: self.author.displayName,
              timestamp: Timestamp.now(),
            } satisfies NameLog],
          } : {})
        } satisfies OperationInterface, {
          type: 'set',
          ref: self.database.getdoc('avatars'),
          data: util.structureData(global.loggingConfig.avatars ? {
            log: [{
              avatar: self.author.avatarURL(),
              timestamp: Timestamp.now(),
            } satisfies AvatarLog],
          } : {})
        } satisfies OperationInterface, {
          type: 'set',
          ref: self.database.getdoc('avatars'),
          data: util.structureData(global.loggingConfig.banners ? {
            log: [{
              banner: self.author.bannerURL(),
              timestamp: Timestamp.now(),
            } satisfies BannerLog],
          } : {})
        } satisfies OperationInterface)

      },
      log: {
        async presence(): Promise<void> {
          if (!global.loggingConfig.presence) return

          await self.database.cd(`~/${self.author.id}/logs`).cat('presence')

          let data: PresenceLog = {
            presence: this.presence,
            guildsSeenIn: [self.guildAuthor.guild.id],
            timestamp: Timestamp.now()
          }

          await self.database.write({
            ['log']: FieldValue.arrayUnion(util.structureData(data))
          })

          self.data.logs.presence.log = data

          Log.info(`Logging user presence with id "${self.author.id}"`)
        },
        async username(): Promise<void> {
          if (!global.loggingConfig.usernames) return

          await self.database.cd(`~/${self.author.id}/logs`).cat('usernames')

          let data: NameLog = {
            name: self.author.username,
            timestamp: Timestamp.now(),
          }

          await self.database.write({
            ['log']: FieldValue.arrayUnion(util.structureData(data))
          })

          self.data.logs.usernames.log = data

          Log.info(`Logging user username with id "${self.author.id}"`)
        },
        async displayName(): Promise<void> {
          if (!global.loggingConfig.displayNames) return

          await self.database.cd(`~/${self.author.id}/logs`).cat('displayNames')

          let data: NameLog = {
            name: self.author.displayName,
            timestamp: Timestamp.now(),
          }

          await self.database.write({
            ['log']: FieldValue.arrayUnion(util.structureData(data))
          })

          self.data.logs.displayName.log = data

          Log.info(`Logging user display name with id "${self.author.id}"`)
        },
        async avatar(write: boolean = true): Promise<void> {
          if (!global.loggingConfig.avatars) return

          // path to the user's storage file
          self.storage.cd(`~/${self.author.id}/avatars/global`)

          // add the avatar file to the storage
          self.global.avatarURL = await self.storage.upload(self.author.displayAvatarURL(), `global_${Timestamp.now().seconds.toString()}.${self.parseExtension(self.author.displayAvatarURL())}`)

          if (!write) return

          await self.database.cd(`~/${self.author.id}/logs`).cat('avatars')

          let data: AvatarLog = {
            avatar: self.global.avatarURL,
            timestamp: Timestamp.now(),
          }

          await self.database.write({
            ['log']: FieldValue.arrayUnion(util.structureData(data))
          })

          self.data.logs.avatars.log = data


          Log.info(`Logging user avatar with id "${self.author.id}"`)
        },
        async banner(write: boolean = true): Promise<void> {
          if (!global.loggingConfig.banners || !self.author.bannerURL()) return

          // path to the user's storage file
          self.storage.cd(`~/${self.author.id}/banners/global`)

          // add the banner file to the storage
          self.global.bannerURL = await self.storage.upload(self.author.bannerURL(), `global_${Timestamp.now().seconds.toString()}.${self.parseExtension(self.author.bannerURL())}`)

          if (!write) return

          await self.database.cd(`~/${self.author.id}/logs`).cat('banners')

          let data: BannerLog = {
            banner: self.global.bannerURL,
            timestamp: Timestamp.now(),
          }

          await self.database.write({
            ['log']: FieldValue.arrayUnion(util.structureData(data))
          })

          self.data.logs.banners.log = data


          Log.info(`Logging user banner with id "${self.author.id}"`)
        },
      },
    }
    this.guild = {
      avatarURL: null,
      bannerURL: null,
      async setupGuildLogs(guild: Guild): Promise<void> {
        await self.fetchGuildAuthor(guild)
        if (!global.loggingConfig.servers) return

        // guild avatar/banner storage
        await Promise.all([
          this.log.avatar(guild, false),
          /* discord.js v14 for some reason doesn't allow you to get user server banners lol
          await this.log.banner(guild, false),
          */
        ])

        let log: GuildData = {
          messageLog: new Map(),
          joined: self.guildAuthor.joinedTimestamp,
          roles: global.loggingConfig.roles ? Object.fromEntries(self.guildAuthor.roles.cache.map((role: Role): Array<any> => ([
            role.id, {
              name: role.name,
              color: role.hexColor,
              icon: role.iconURL(),
            } satisfies GuildRole
          ]))) : {},
          avatar:  self.guildAuthor.avatarURL(),
          nickname: self.guildAuthor.nickname,
          avatarLog: global.loggingConfig.avatars ? [{
            avatar: self.guildAuthor.avatarURL(),
            timestamp: Timestamp.now(),
          }] : [],
          nicknameLog: global.loggingConfig.nicknames ? [{
            name: self.guildAuthor.nickname,
            timestamp: Timestamp.now(),
          }] : [],
        }

        self.operations.push({
          type: 'set',
          ref: self.database.cd(`~/${self.author.id}/guilds`).getdoc(self.guildAuthor.guild.id),
          data: util.structureData(log)
        })

        self.data.guilds = log

      },
      log: {
        async message(message: Message): Promise<void> {
          await self.fetchGuildAuthor(message.guild)
          if (!global.loggingConfig.servers || !global.loggingConfig.messages) return

          // path to the user's storage file
          self.storage.cd(`~/${self.author.id}/messages/${message.guild.id}/${message.id}`)

          // collect attachments
          let attachmentURLs: Array<string> = []
          for (let attachment of message.attachments.values())
            attachmentURLs.push(await self.storage.upload(attachment.url))

          // collect linked attachments
          for (let embed of message.embeds.values()) {
            if (!embed.data.url.includes('tenor.com/view/') && !embed.data.url.includes('cdn.discordapp.com')) continue
            if (embed.data.video)
              attachmentURLs.push(await self.storage.upload(embed.data.video.url))
            if (embed.data.image)
              attachmentURLs.push(await self.storage.upload(embed.data.image.url))
          }

          self.database.cd(`~/${self.author.id}/guilds`)
          await self.database.cat(message.guild.id)

          // add the message to their userLog
          let log: MessageLog = {
            content: message.content,
            attachments: attachmentURLs,
            timestamp: Timestamp.fromMillis(message.createdTimestamp),
            link: message.url,
          }
          await self.database.write({
            [`messageLog.${message.id}`]: util.structureData(log)
          })

          self.data.guilds.messageLog[message.id] = log

          Log.info(`Updating user message with id "${self.author.id}:" in guild ${message.guild.id}`)
        },
        async avatar(guild: Guild, write: boolean = true): Promise<void> {
          await self.fetchGuildAuthor(guild)
          let url: string = self.guildAuthor.avatarURL()
          if (!global.loggingConfig.servers || !global.loggingConfig.avatars || !url || url === self.author.displayAvatarURL()) return

          // path to the user's storage file
          self.storage.cd(`~/${self.author.id}/avatars/guilds/${self.guildAuthor.guild.id}`)

          // add the avatar file to the storage
          self.guild.avatarURL = await self.storage.upload(url, `guild_${Timestamp.now().seconds.toString()}.${self.parseExtension(url)}`)

          if (!write) return

          await self.database.cd(`~/${self.author.id}/guilds`).cat(guild.id)

          let log: AvatarLog = {
            avatar: self.guild.avatarURL,
            timestamp: Timestamp.now(),
          }
          await self.database.write({
            ['avatarLog']: FieldValue.arrayUnion(util.structureData(log))
          })

          self.data.guilds.avatarLog = log

          Log.info(`Updating user avatar with id "${self.author.id}" in guild ${self.guildAuthor.guild.id}`)
        },
        async banner(guild: Guild, write: boolean = true): Promise<void> {
          await self.fetchGuildAuthor(guild)
          let url: string = ''//self.guildAuthor.bannerURL()
          if (!global.loggingConfig.servers || !global.loggingConfig.banners || !url || url === self.author.bannerURL()) return

          // path to the user's storage file
          self.storage.cd(`~/${self.author.id}/banners/guilds/${self.guildAuthor.guild.id}`)

          // add the banner file to the storage
          self.guild.bannerURL = await self.storage.upload(url, `guild_${Timestamp.now().seconds.toString()}.${self.parseExtension(url)}`)

          if (!write) return

          await self.database.cd(`~/${self.author.id}/guilds`).cat(guild.id)

          let log: BannerLog = {
            banner: self.guild.bannerURL,
            timestamp: Timestamp.now(),
          }
          await self.database.write({
            ['bannerLog']: FieldValue.arrayUnion(util.structureData(log))
          })

          self.data.guilds.bannerLog = log

          Log.info(`Updating user banner with id "${self.author.id}" in guild ${self.guildAuthor.guild.id}`)
        },
      }
    }

    this.misc = {
      scoreGame: {
        async setup(guild: Guild): Promise<void> {
          self.fetchGuildAuthor(guild)
          if (guild.id !== global.testServerId || self.guildAuthor.joinedAt.getMilliseconds() > 1711954800) return

          let roles: Collection<string, Role> = self.guildAuthor.roles.cache.filter((role: Role): boolean => Object.keys(BaseScore).includes(role.id))
          let score: number = roles.size === 0 ? BaseScore['878403773066784839'] :BaseScore[
            [...roles.values()].reduce((highest: Role, current: Role): Role => BaseScore[current.id] > BaseScore[highest.id] ? current : highest).id
          ]

          let data = {
            score,
            cooldown: {
              score: 0,
              leaderboard: 0,
              claim: 0,
              steal: 0,
              gamble: 0,
              shield: 0,
            },
            shieldEnd: null,
          }

          self.operations.push({
            type: 'set',
            ref: self.database.cd(`~/${self.author.id}/scoregame`).getdoc('data'),
            data: util.structureData(data)
          })

          self.data.scoregame = {
            data
          }
        },
        async setCooldown(guild: Guild, type: Cooldown, time: number): Promise<void> {
          self.fetchGuildAuthor(guild)
          if (guild.id !== global.testServerId) return

          await self.database.cd(`~/${self.author.id}/scoregame`).cat('data')

          await self.database.write(util.structureData({
            [`cooldown.${type}`]: time
          }))

          self.data.scoregame.data.cooldown[type] = time
        },
        async setScore(guild: Guild, amount: number): Promise<void> {
          self.fetchGuildAuthor(guild)
          if (guild.id !== global.testServerId) return

          await self.database.cd(`~/${self.author.id}/scoregame`).cat('data')

          await self.database.write(util.structureData({
            ['score']: amount
          }))

          self.data.scoregame.data.score = amount
        },
        async setShield(guild: Guild, state: number): Promise<void> {
          self.fetchGuildAuthor(guild)
          if (guild.id !== global.testServerId) return

          await self.database.cd(`~/${self.author.id}/scoregame`).cat('data')

          await self.database.write(util.structureData({
            ['shieldEnd']: state
          }))

          setTimeout(async (): Promise<void> => {
            await self.database.write(util.structureData({
              ['shieldEnd']: null
            }))
          }, global.shieldDuration * 1e3)

          self.data.scoregame.data.shieldEnd = state
        }
      }
    }
  }
  private async fetchGuildAuthor(guild: Guild): Promise<void> {
    // TODO: fix the bug that make's fetching guildAuthor break if user is no longer within guild
    if (guild.id === this.guildAuthor?.guild.id) return
    this.guildAuthor = await guild.members.fetch(this.author.id)
  }
  public async getData(): Promise<this> {
    this.database.cd('~/')
    let doc = await this.database.getdoc(this.author.id).get()
    this.data = doc.data()

    return this
  }
  public async getScoreGame(): Promise<this> {
    this.database.cd(`~/${this.author.id}/scoregame`)
    let scoregame = await this.database.getdoc('data').get()
    this.data.scoregame = {
      data: scoregame.data()
    }

    return this
  }
  public async create(guild?: Guild): Promise<this> {
    try {
      if (guild)
        await this.fetchGuildAuthor(guild)

      await Promise.all([
        this.global.setupMain(),
        this.global.setupLogs(),
        guild ? this.guild.setupGuildLogs(guild) : Promise.resolve(),
        this.misc.scoreGame.setup(guild),
      ])

      await Database.batchWrite(this.operations)

      Log.info(`Creating document for user with id "${this.author.id}"`)

      //await this.getData()
      //await this.getScoreGame()

      Database.users.set(this.author.id, this)

      return this
    } catch (err) {
      Log.error(`Failed to create document for user with id ${this.author.id}`, err)
      await this.database.cd('~/').rm(this.author.id)
      await this.storage.cd('~/').rm(this.author.id)
      Database.users.delete(this.author.id)
    }
  }
  private parseExtension(url: string): string {
    return url.match(/\.([0-9a-z]+)(?:[\?#]|$)/i)[0] ?? 'png'
  }
}

export default UserData
