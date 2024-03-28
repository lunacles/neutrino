import {
  Message,
  User,
  GuildMember,
  Collection,
  Role,
  Guild,
  Activity,
} from 'discord.js'
import {
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
import global from '../global.js'
import * as util from '../utilities/util.js'
import {
  FireStorage,
  FireStorageInterface,
} from './storage.js'
import bot from '../main.js'

interface GlobalInterface {
  avatarURL: string
  bannerURL: string
  presence: UserPresence

  storeAvatar: (url: string) => Promise<void>
  storeBanner: (url: string) => Promise<void>
  setupMain: () => Promise<void>
  setupLogs: () => Promise<void>
}

interface GuildLogsInterface {
  message: (message: Message) => Promise<void>
}

interface GuildInterface {
  avatarURL: string
  bannerURL: string

  storeAvatar: (guild: Guild, url: string) => Promise<void>
  storeBanner: (guild: Guild, url: string) => Promise<void>
  setupGuildLogs: () => Promise<void>

  log: GuildLogsInterface
}

const UserData = class {
  static async new(id: string, guild?: Guild) {
    let author: User = await bot.client.users.fetch(id, { force: true })
    return new UserData(author).create(guild)
  }
  private storage: FireStorageInterface
  private database: DatabaseInterface
  private author: User
  private guildAuthor: GuildMember

  public global: GlobalInterface
  public guild: GuildInterface
  constructor(author: User) {
    const self = this

    this.storage = new FireStorage()
    this.database = new Database()

    this.author = author
    this.guildAuthor = null

    this.global = {
      avatarURL: null,
      bannerURL: null,

      presence: {
        activities: null,
        status: null,
      },
      async storeAvatar(url: string): Promise<void> {
        if (!global.loggingConfig.avatars || !url) return

        // path to the user's storage file
        self.storage.cd(`~/${self.author.id}/avatars/global`)

        // add the avatar file to the storage
        this.avatarURL = await self.storage.upload(url, `global_${Timestamp.now().seconds.toString()}.${self.parseExtension(url)}`)

        await self.database.cd(`~/${self.author.id}/logs`).cat('avatars')
        await self.database.write({
          ['log']: FieldValue.arrayUnion(util.structureData({
            avatar: this.avatarURL,
            timestamp: Timestamp.now(),
          } satisfies AvatarLog))
        })
        Log.info(`Logging user ${self.author.id}'s new global avatar`)
      },
      async storeBanner(url: string): Promise<void> {
        if (!global.loggingConfig.banners || !url) return

        // path to the user's storage file
        self.storage.cd(`~/${self.author.id}/banners/global`)

        // add the banner file to the storage
        this.bannerURL = await self.storage.upload(url, `global_${Timestamp.now().seconds.toString()}.${self.parseExtension(url)}`)

        await self.database.cd(`~/${self.author.id}/logs`).cat('banners')
        await self.database.write({
          ['log']: FieldValue.arrayUnion(util.structureData({
            banner: this.bannerURL,
            timestamp: Timestamp.now(),
          } satisfies BannerLog))
        })
        Log.info(`Logging user ${self.author.id}'s new global banner`)
      },
      async setupMain(): Promise<void> {
        self.database.cd('~/')

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

        await self.database.mkdir(self.author.id, util.structureData({
          id: self.author.id,
          creationDate: Timestamp.fromDate(self.author.createdAt),
          username: self.author.username,
          presence: this.presence,
          displayName: self.author.globalName,
          avatar: this.avatarURL,
          banner: this.bannerURL,
          avatarDecoration: self.author.avatarDecorationURL(),
        } satisfies UserInfo))
      },
      async setupLogs(): Promise<void> {
        self.database.cd(`~/${self.author.id}/logs`)

        await self.database.mkdir('presence', util.structureData(global.loggingConfig.presence ? {
          log: [{
            presence: this.presence,
            guildsSeenIn: [self.guildAuthor.guild.id],
            timestamp: Timestamp.now()
          } satisfies PresenceLog],
        } : {}))
        await self.database.mkdir('usernames', util.structureData(global.loggingConfig.usernames ? {
          log: [{
            name: self.author.username,
            timestamp: Timestamp.now(),
          } satisfies NameLog],
        } : {}))
        await self.database.mkdir('displayNames', util.structureData(global.loggingConfig.displayNames ? {
          log: [{
            name: self.author.displayName,
            timestamp: Timestamp.now(),
          } satisfies NameLog],
      } : {}))
        await self.database.mkdir('avatars', util.structureData(global.loggingConfig.avatars ? {
          log: [{
            avatar: this.avatarURL,
            timestamp: Timestamp.now(),
          } satisfies AvatarLog],
        } : {}))
        await self.database.mkdir('banners', util.structureData(global.loggingConfig.banners ? {
          log: [{
            banner: this.bannerURL,
            timestamp: Timestamp.now(),
          } satisfies BannerLog],
        } : {}))
      }
    }
    this.guild = {
      avatarURL: null,
      bannerURL: null,
      async storeAvatar(guild: Guild, url: string): Promise<void> {
        await self.fetchGuildAuthor(guild)
        if (!global.loggingConfig.avatars || !url || url === self.author.avatarURL()) return

        // path to the user's storage file
        self.storage.cd(`~/${self.author.id}/avatars/guilds/${self.guildAuthor.guild.id}`)

        // add the banner file to the storage
        this.avatarURL = await self.storage.upload(url, `guild_${Timestamp.now().seconds.toString()}.${self.parseExtension(url)}`)

        await self.database.cd(`~/${self.author.id}/guilds`).cat(guild.id)
        await self.database.write({
          ['avatarLog']: FieldValue.arrayUnion(util.structureData({
            avatar: this.avatarURL,
            timestamp: Timestamp.now(),
          } satisfies AvatarLog))
        })
        Log.info(`Logging user ${self.author.id}'s new avatar in guild ${self.guildAuthor.guild.id}`)
      },
      async storeBanner(guild: Guild, url: string): Promise<void> {
        await self.fetchGuildAuthor(guild)
        if (!global.loggingConfig.banners || !url || url === self.author.bannerURL()) return

        // path to the user's storage file
        self.storage.cd(`~/${self.author.id}/banners/guilds/${self.guildAuthor.guild.id}`)

        // add the banner file to the storage
        this.bannerURL = await self.storage.upload(url, `guild_${Timestamp.now().seconds.toString()}.${self.parseExtension(url)}`)

        await self.database.cd(`~/${self.author.id}/guilds`).cat(self.guildAuthor.guild.id)
        await self.database.write({
          ['bannerLog']: FieldValue.arrayUnion(util.structureData({
            banner: this.bannerURL,
            timestamp: Timestamp.now(),
          } satisfies BannerLog))
        })
        Log.info(`Logging user ${self.author.id}'s new banner in guild ${self.guildAuthor.guild.id}`)
      },
      async setupGuildLogs(): Promise<void> {
        self.database.cd(`~/${self.author.id}/guilds`)

        let roles: Collection<string, Role> = self.guildAuthor.roles.cache
        await self.database.mkdir(self.guildAuthor.guild.id, util.structureData(global.loggingConfig.servers ? {
          messageLog: new Map(),
          joined: self.guildAuthor.joinedTimestamp,
          roles: global.loggingConfig.roles ? Object.fromEntries(roles.map((role: Role): Array<any> => ([
            role.id, {
              name: role.name,
              color: role.hexColor,
              icon: role.iconURL(),
            } satisfies GuildRole
          ]))) : {},
          avatar:  this.avatarURL,
          nickname: self.guildAuthor.nickname,
          avatarLog: global.loggingConfig.avatars ? [{
            avatar: this.avatarURL,
            timestamp: Timestamp.now(),
          }] : [],
          nicknameLog: global.loggingConfig.nicknames ? [{
            name: self.guildAuthor.nickname,
            timestamp: Timestamp.now(),
          }] : [],
        } satisfies GuildData : {}))
      },
      log: {
        async message(message: Message): Promise<void> {
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
          await self.database.write({
            [`messageLog.${message.id}`]: util.structureData({
              content: message.content,
              attachments: attachmentURLs,
              timestamp: Timestamp.fromMillis(message.createdTimestamp),
              link: message.url,
            } satisfies MessageLog)
          })
          Log.info(`Logging user ${self.author.id}'s message in guild ${message.guild.id}`)
        },
      }
    }
  }
  private async fetchGuildAuthor(guild: Guild): Promise<void> {
    if (guild.id === this.guildAuthor?.guild.id) return
    this.guildAuthor = await guild.members.fetch(this.author.id)
  }
  public async create(guild?: Guild): Promise<this> {
    if (guild)
      await this.fetchGuildAuthor(guild)

    // logs collection
    await this.global.setupLogs()

    // guild logs collection
    await this.guild.setupGuildLogs()

    // global avatar/banner storage
    await this.global.storeAvatar(this.author.displayAvatarURL())
    await this.global.storeBanner(this.author.bannerURL())

    // guild avatar/banner storage
    if (guild) {
      await this.guild.storeAvatar(guild, this.guildAuthor.avatarURL())
      /* discord.js v14 for some reason doesn't allow you to get user server banners lol
      await this.guild.storeBanner(guild, this.guildAuthor.bannerURL())
      */
    }

    // main doc & user info
    await this.global.setupMain()

    Database.users.set(this.author.id, await this.database.cat(this.author.id))

    return this
  }
  private parseExtension(url: string): string {
    return url.match(/\.([0-9a-z]+)(?:[\?#]|$)/i)[0] ?? 'png'
  }
}

export default UserData
