import {
  Presence,
} from 'discord.js'
import { Timestamp } from 'firebase-admin/firestore'

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

export interface ServerData {
  nickname: string
  avatar: string
  joined: number,
  avatarLog: Array<AvatarLog>
  messageLog: Map<string, MessageLog>
  nicknameLog: Array<NameLog>
}

export interface PresenceLog {
  presence: Presence
  timestamp: Timestamp
  guildsSeenIn: Array<string>
}

export interface UserInfo {
  id: string
  creationDate: Timestamp
  presence: Presence  // presenceUpdate
  username: string  // userUpdate
  displayName: string // userUpdate
  avatar: string // userUpdate
  avatarDecoration: string // userUpdate
  banner: string // userUpdate
}
