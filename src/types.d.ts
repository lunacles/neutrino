import {
  ChatInputCommandInteraction,
  CacheType,
  CommandInteraction,
  GuildBasedChannel,
  ChannelType,
  Collection,
  PermissionsBitField,
  GuildChannel,
  GuildTextBasedChannel,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
  RoleSelectMenuInteraction,
  MentionableSelectMenuInteraction,
  ChannelSelectMenuInteraction,
  ButtonInteraction,
  Events,
  Message,
  Snowflake,
  Attachment,
} from 'discord.js'
import {
  DocumentReference,
  Timestamp
} from 'firebase-admin/firestore'
import MessageCreate from 'observer/message/messageCreate'

export interface CommandInterface {
  readonly name: string
  readonly description: string
  readonly data: any,

  public execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void>
  public test(): boolean
}
export interface ObserverInterface {
  readonly interaction: CommandInteraction
  public filter: Collection<string, GuildBasedChannel>

  public filterChannels(): this
  public byChannelType(type: ChannelType): this
  public byExactName(name: string): this
  public byNameQuery(query: string): this
  public byParentId(parentId: string): this
  public finishFilter(): Collection<string, GuildBasedChannel>
  public componentsFilter(components: Array<string>): (component: Action) => boolean
  public checkPermissions(permissions: Array<bigint>, channel: GuildChannel): boolean
  public abort(code: number): Promise<void>
  public panic(error: Error, command: string): Promise<void>
}
export type Action = StringSelectMenuInteraction<CacheType> | UserSelectMenuInteraction<CacheType> | RoleSelectMenuInteraction<CacheType> | MentionableSelectMenuInteraction<CacheType> | ChannelSelectMenuInteraction<CacheType> | ButtonInteraction<CacheType>
export type CachedElement = 'bar' | 'text' | 'rect' | null
export type Radii = Array<number> | number
export type ClipType = 'circle' | 'rect' | 'path'
export type Pair = [number, number]
export type ColorValue = typeof Color | Array<number> | string | object
export interface Coordinate {
  private x: number
  private y: number
}
export interface Dimensions {
  private width: number
  private height: number
}
export interface PointTo {
  private readonly x1: number
  private readonly y1: number
  private readonly x2: number
  private readonly y2: number
}
export interface Cached {
  public type: CachedElement,
  public run: Function,
}
export interface Gradient {
  private color: any
  private readonly pos: number
}
export interface LinearGradient extends PointTo {
  private readonly gradient: Array<Gradient>
}
export interface RadialGradient extends LinearGradient {
  private readonly  r1: number
  private readonly  r2: number
}
export interface RectangleInterface extends Coordinate, Dimensions {}
export interface RoundRectangleInterface extends RectangleInterface {
  private readonly radii: Radii
}
export interface LineInterface extends PointTo {}
export interface CurveInterface extends Coordinate {
  private readonly radius: number
  private readonly startAngle?: number
  private readonly endAngle?: number
}
export interface TextInterface extends Coordinate {
  private readonly size: number
  private readonly text: string
  private readonly align?: CanvasTextAlign
  private readonly style?: string
  private readonly family?: string
}
export interface MediaInterface extends RectangleInterface {
  private readonly dir: string
}
export interface Wall extends RectangleInterface {}
export interface MapDimensions extends RectangleInterface {}
export interface NodeCanvasInterface extends Dimensions {
  readonly canvas: any
  ctx: CanvasRenderingContext2D
  centerX: number
  centerY: number
  scale: number
  ratio: number
}
export interface Viewport extends RectangleInterface {}
export type Seed = string | number
export type Algorithm = RandomWalkerInterface | NoiseInterface
export enum PlacementType {
  Empty = 0,
  Wall = 1,
}
export interface MazeInterface extends Dimensions {
  type: number
  array: Array<any>
  seed: number
  walls: Array<Wall>
  ran: RandomInterface

  get(x: number, y: number): any
  set(x: number, y: number, value: any): any
  entries(): Array<any>
  has(x: number, y: number): boolean
  findPockets(): void
  combineWalls(): void
  mergeWalls(): void
}
export type Mutation = RandomInterface | number
export interface DomainWarp extends Coordinate {
  z: number
}
export interface ImprovedNoiseInterface {
  noise(x: number, y: number, z: number): number
  quantize(value: number, threshold: number): number
  dynamic(x: number, y: number, z: number, time: Date): number
  domainWarp(warp: number, x: number, y: number, z: number): DomainWarp
  multiScale(amplitude: number, frequency: number, amplitudeMultiplier: number, frequencyMultiplier: number, x: number, y: number, z: number): number
}
export type Movement = Array<number> | number
export interface WalkerSetup extends Coordinate {
  maze: MazeInterface
  ran: RandomInterface
}
export interface WalkerChances {
  straightChance: number
  turnChance: number
  branchChance: number
}
export interface WalkerInstructions {
  startDirections: Movement
  branchDirections: Movement
  placementType: number
}
export interface WalkerSettings {
  borderWrapping: boolean
  terminateOnContact: boolean
}
export interface WalkerLimits {
  minLength: number
  maxLength: number
  minTurns: number
  maxTurns: number
  minBranches: number
  maxBranches: number
}
export interface WalkerConfig {
  setup: WalkerSetup
  chances: WalkerChances
  instructions: WalkerInstructions
  settings: WalkerSettings
  limits: WalkerLimits
}
export interface WalkerInterface extends Coordinate {
  setup: WalkerSetup
  chances: WalkerChances
  instructions: WalkerInstructions
  settings: WalkerSettings
  limits: WalkerLimits
  maze: MazeInterface
  ran: number
  walk(type: number): void,
}
export type NoiseAlgorithms = 'normal' | 'clamped' | 'quantized' | 'dynamic' | 'domainWarped' | 'multiScale' | 'marble'
export interface Turbulence {
  power: number
  size: number
}
export interface NoiseInterface {
  maze: MazeInterface
  ran: RandomInterface
  perlin: ImprovedNoiseInterface
  init(): void
  setThreshold(threshold: number): this
  setClamp(min: number, max: number): this
  setZoom(threshold: number): this

  normal(): this
  clamped(): this
  quantized(): this
  dynamic(): this
  domainWarped(): this
  multiScale(): this
  marble(): this
}
export interface RandomWalkerInterface {
  maze: MazeInterface
  seedAmount: number
  ran: RandomInterface

  walkerChances: WalkerChances
  walkerInstructions: WalkerInstructions
  walkerSettings: WalkerSettings
  walkerLimits: WalkerLimits

  init(): void
}
export interface RandomInterface {
  prng: Function
  result: number
  asInteger(): number
  asFloat(): number
  fromRange(min: number, max: number): this
  float(n?: number): number
  integer(i?: number): number
  chance(probability: number): boolean
  fromArray(array: Array<any>): any
  fromObject(object: object ): number
  index(probabilities: Array<any>): number
  shuffleArray(array: Array<any>): Array<any>
}
export interface PRNGInterface {
  MathRandom(): () => number
  crypto(): () => number
  sfc32(a: number, b: number, c: number, d: number): () => number
  splitMix32(a: number): () => number
  simple(a: number): () => number
}
export interface SecretInterface {
  readonly secret: string
  readonly key: Buffer
  cyrb53(str: string, seed?: number): number
  hash(str: string): string
  encrypt(str: string): string
  decrypt(str: string): string
}
export interface DatabaseInterface {
  collection: CollectionReference
  doc: DocumentReference

  cd(dir: string): this
  mkdir(name: string, data?: object): Promise<DocumentReference>
  cat(name?: string): Promise<DocumentSnapshot | DocumentReference>
  getdoc(name: string): DocumentReference
  write(data: object): Promise<this>
  rm(name?: string): Promise<this>
}
export interface UserDataInterface {
  operations: Array<OperationInterface>
  timeSinceLastOperation: number
  storage: FireStorageInterface
  database: DatabaseInterface
  user: User
  member: GuildMember

  globalData: UserInfo
  guildData: GuildMemberInfo
  guildCollection: GuildCollectionInterface
  xpData: XPManagerInterface
  lootLeague: LootLeagueInterface
  guild: DatabaseInterface
  doc: DocumentReference<DocumentData, DocumentData>
  data: DocumentData

  setup(): OperationInterface
  restoreData(): Promise<this>
  create(): Promise<this>
  pushOperation(operation: OperationInterface): Promise<this>
  writeBatch(): Promise<this>
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
export interface LootLeagueInterface extends ScoreGame {
  setup(): ScoreGame
  setCooldown(type: Cooldowns, time: number): Promise<void>
  setScore(amount: number): Promise<void>
  setShield(state: number): Promise<void>
}
export interface GuildCollectionInterface {
  guild: Guild
  guildDatabase: DatabaseInterface
  members: Map<string, UserDataInterface>
  data: GuildInfo
  ref: DocumentReference

  fetchData(): Promise<this>
  fetchMember(id: string): Promise<UserDataInterface>
  setup(): Promise<DocumentReference>
}
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
export interface XPManagerInterface extends XPData {
  setup(): XPData
  setXP(amount: number): Promise<void>
  setLevel(level: number): Promise<void>
  setCooldown(length: number): Promise<void>
  passiveXP(): Promise<void>
}
export interface Observer {
  eventID: Events
  active: boolean
  react: Function
}
export interface MessageObserverInterface {
  create: Observer
}
export interface FireStorageInterface {
  cd(dir: string): this
  rm(name?: string): Promise<this>
  upload(url: string, fileName?: string): Promise<string>
}
export enum OperationType {
  Set = 'set',
  Update = 'update',
  Delete = 'delete',
}
