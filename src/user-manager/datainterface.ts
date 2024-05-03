import {
  DocumentReference,
  Timestamp
} from 'firebase-admin/firestore'

export interface GuildRole {
  name: string,
  color: string,
  icon: string,
}

export interface XPData {
  level: number
  xp: number
  cooldown: number
}

export interface Cooldown {
  score: number
  leaderboard: number
  claim: number
  steal: number
  gamble: number
  shield: number
}

export interface ScoreGame {
  score: number
  cooldown: Cooldown
  shieldEnd: number
}

export interface GlobalData {
  id: string
  creationDate: Timestamp
  username: string
  displayName: string
  avatar: string
  banner: string
  avatarDecoration: string
}

export interface GuildMemberInfo {
  id: string,
  roles: Map<string, GuildRole>
  nickname: string
  avatar: string
  joined: number
  xpData: XPData
  scoreGame: ScoreGame
  global: GlobalData
}

export interface UserInfo {
  id: string
  creationDate: Timestamp
  username: string  // userUpdate
  displayName: string // userUpdate
  avatar: string // userUpdate
  avatarDecoration: string // userUpdate
  banner: string // userUpdate
}

export interface OperationInterface {
  type: string
  ref: DocumentReference
  data: object
}

export interface GuildInfo {
  approximateMemberCount: number
  approximatePresenceCount: number
  premiumSubscriptionCount: number
  memberCount: number
  ownerId: string
  members: Map<string, GuildMemberInfo>
  id: string
  icon: string
  banner: string
  description: string
  vanityURLCode: string
  createdTimestamp: number
  joinedTimestamp: number
  available: boolean
  large: boolean
  partnered: boolean
  verified: boolean
  nsfwLevel: number
  shardId: number
}
