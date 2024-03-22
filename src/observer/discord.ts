import {

  Presence,
} from 'discord.js'
import { Timestamp } from 'firebase-admin/firestore'

interface MessageLog {
  content: string
  attachments: Array<string>
  timestamp: Timestamp
  link: string
}

interface AvatarLog {
  avatar: string
  timestamp: Timestamp
}

interface BannerLog {
  banner: string
  timestamp: Timestamp
}

interface NicknameLog {
  name: string
  timestamp: Timestamp
}

interface ServerData {
  nickname: string
  avatar: string
  joined: number,
  avatarLog: Array<AvatarLog>
  messageLog: Map<string, MessageLog>
  nicknameLog: Array<NicknameLog>
}

interface PresenceLog {
  presence: Presence
  timestamp: Timestamp
  guildsSeenIn: Array<string>
}

interface StringLog {
  value: string
  timestamp: Timestamp
}

interface UserLogInterface {
  id: string
  creationDate: Timestamp
  presence: Presence  // presenceUpdate
  presenceLogs: Array<PresenceLog> // presenceUpdate
  servers: Map<string, ServerData> //
  username: string  // userUpdate
  usernameLog: Array<StringLog> // userUpdate
  displayName: string // userUpdate
  displayNameLog: Array<StringLog> // userUpdate
  avatar: string // userUpdate
  avatarLog: Array<AvatarLog> // userUpdate
  avatarDecoration: string // userUpdate
  banner: string // userUpdate
  bannerLog: Array<BannerLog> // userUpdate
}

export default UserLogInterface
