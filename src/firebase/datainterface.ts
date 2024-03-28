import {
  ActivityType,
} from 'discord.js'
import {
  Timestamp
} from 'firebase-admin/firestore'

export interface MessageLog {
  content: string
  attachments: Array<string>
  timestamp: Timestamp
  link: string
}

export interface AvatarLog {
  avatar: string
  timestamp: Timestamp
}

export interface BannerLog {
  banner: string
  timestamp: Timestamp
}

export interface NameLog {
  name: string
  timestamp: Timestamp
}

export interface GuildRole {
  name: string,
  color: string,
  icon: string,
}

export interface GuildData {
  roles: Map<string, GuildRole>
  nickname: string
  avatar: string
  joined: number
  avatarLog: Array<AvatarLog>
  messageLog: Map<string, MessageLog>
  nicknameLog: Array<NameLog>
}

export interface RichPresence {
  largeImageURL: string
  largeText: string
  smallImageURL: string
  smallText: string
}

export interface Emojicon {
  animated: boolean
  timestamp: Timestamp
  id: string
  identifier: string
  name: string
  url: string
}

export interface Party {
  id: string
  size: [number, number]
}

export interface UserActivity {
  id: string
  assets: RichPresence
  buttons: Array<string>
  timestamp: Timestamp
  details: string
  emoji: Emojicon
  name: string
  party: Party
  state: string
  type: ActivityType
  url: string
}

export interface UserPresence {
  activities: Array<UserActivity>
  status: string
}

export interface PresenceLog {
  presence: UserPresence
  timestamp: Timestamp
  guildsSeenIn: Array<string>
}

export interface UserInfo {
  id: string
  creationDate: Timestamp
  presence: UserPresence  // presenceUpdate
  username: string  // userUpdate
  displayName: string // userUpdate
  avatar: string // userUpdate
  avatarDecoration: string // userUpdate
  banner: string // userUpdate
}
