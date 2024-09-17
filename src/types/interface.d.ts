// config
interface CommandCooldownInterface {
  readonly score: number
  readonly claim: number
  readonly steal: number
  readonly gamble: number
  readonly shield: number
  readonly leaderboard: number
  readonly blackjack: number
}
interface Direction {
  none: number
  left: number
  right: number
  up: number
  down: number
}
interface DiagonalDirection {
  readonly upLeft: number
  readonly downLeft: number
  readonly upRight: number
  readonly downRight: number
}
interface MovementOptions {
  all: Array<number> | number,
  diagonal: Array<number> | number,
  vertical: Array<number> | number,
  horizontal: Array<number> | number,
}
interface CommandChannels {
  readonly lootLeague: string
  readonly mazeGeneration: string
  readonly misc: string
}
interface ENV {
  readonly FIREBASE_API_KEY: string
  readonly FIREBASE_AUTH_DOMAIN: string
  readonly FIREBASE_PROJECT_ID: string
  readonly FIREBASE_STORAGE_BUCKET: string
  readonly FIREBASE_MESSAGE_SENDER_ID: string
  readonly FIREBASE_APP_ID: string
  readonly FIREBASE_MEASUREMENT_ID: string
  readonly BOT_TOKEN: string
  readonly BOT_CLIENT_ID: string
  readonly NODE_ENV: string
}

interface ConfigInterface {
  readonly build: any
  readonly ownerId: string
  readonly testServerId: string
  readonly cooldown: CommandCooldownInterface
  cooldowns: Map<string, CommandCooldownInterface>
  readonly shieldDuration: number
  direction: Direction
  diagonalDirection: DiagonalDirection
  movementOptions: MovementOptions
  readonly batchTick: number
  readonly errorTraceChannel: string
  readonly commandChannels: CommandChannels
  readonly env: ENV
  readonly botId: string
  readonly databaseType: DatabaseType
  readonly rolePersistCap: number
  readonly prefix: string
  readonly heartbeatInterval: number
}

// utilities
interface DeletedUsersInterface {
  ids: Map<string, string>
  fixId(id: string): string
}
interface LogInterface {
  startTime: number
  get uptime(): string
  get time(): string
  error(reason: string, err?: Error | object): void
  warn(reason: string): void
  info(info: string): void
}
interface BuildInterface {
  id: string
  date: string
  message: string
  diff: string
  load(): Promise<void>
}
interface RandomInterface {
  readonly prng: Function
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
interface PRNGInterface {
  MathRandom(): () => number
  crypto(): () => number
  sfc32(a: number, b: number, c: number, d: number): (fetchSeed?: boolean) => number | Quaple<number>
  splitMix32(a: number): () => number
  simple(a: number): () => number
}
interface SecretInterface {
  readonly secret: string
  readonly key: Buffer
  cyrb53(str: string, seed?: number): number
  hash(str: string): string
  encrypt(str: string): string
  decrypt(str: string): string
}

// canvas
interface Coordinate {
  x: number
  y: number
}
interface Dimensions {
  width: number
  height: number
}
interface PointTo {
  x1: number
  y1: number
  x2: number
  y2: number
}
interface CacheFunction {
  fill?: ColorValue
  stroke?: ColorValue
  lineWidth?: number
}
interface Cached {
  parent?: CanvasRenderingContext2D
  type: CachedElement
  run: ({}?: CacheFunction) => void
}
interface Gradient {
  color: any
  pos: number
}
interface LinearGradient extends PointTo {
  gradient: Array<Gradient>
}
interface RadialGradient extends LinearGradient {
   r1: number
   r2: number
}
interface RectangleInterface extends Coordinate, Dimensions {}
interface RoundRectangleInterface extends RectangleInterface {
  radii: Radii
}
interface LineInterface extends PointTo {}
interface CurveInterface extends Coordinate {
  radius: number
  startAngle?: number
  endAngle?: number
}
interface TextInterface extends Coordinate {
  size?: number
  text: string
  align?: CanvasTextAlign
  style?: string
  family?: string
  fitToWidth?: number
  fitToHeight?: number
}
interface MediaInterface extends RectangleInterface {
  dir: string
}
interface Wall extends RectangleInterface {}
interface MapDimensions extends RectangleInterface {}
interface NodeCanvasInterface extends Dimensions {
  readonly canvas: any
  ctx: CanvasRenderingContext2D
  readonly centerX: number
  readonly centerY: number
  readonly scale: number
  readonly ratio: number
}
interface Viewport extends RectangleInterface {}
interface CardImageInterface extends Coordinate {
  size: number
}


// commands
interface CommandInterface {
  readonly name: string
  readonly description: string
  readonly data: any,

  execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void>
  test(): boolean
}
interface ObserverInterface {
  readonly interaction: CommandInteraction
  filter: Collection<string, GuildBasedChannel>

  filterChannels(): this
  byChannelType(type: ChannelType): this
  byExactName(name: string): this
  byNameQuery(query: string): this
  byParentId(parentId: string): this
  finishFilter(): Collection<string, GuildBasedChannel>
  componentsFilter(components: Array<string>): (component: Action) => Promise<boolean>
  checkPermissions(permissions: Array<bigint>, channel: GuildChannel): boolean
  abort(code: typeof Abort[keyof typeof Abort]): Promise<void>
  panic(error: Error, command: string): Promise<void>
  defer(ephemeral: boolean): Promise<this>
  fetchAbort(): Promise<void>
  isOnCooldown(type: keyof Cooldown): boolean
  resetCooldown(type: keyof Cooldown): void
  getCooldown(type: keyof Cooldown): number
}


// mazes
interface MazeInterface extends Dimensions {
  type: number
  array: Array<any>
  seed: number
  walls: Array<Wall>
  prng: Function
  ran: RandomInterface

  get(x: number, y: number): any
  set(x: number, y: number, value: any): any
  entries(): Array<any>
  has(x: number, y: number): boolean
  findPockets(): void
  combineWalls(): void
  mergeWalls(): void
}
interface DomainWarp extends Coordinate {
  z: number
}
interface ImprovedNoiseInterface {
  noise(x: number, y: number, z: number): number
  quantize(value: number, threshold: number): number
  dynamic(x: number, y: number, z: number, time: Date): number
  domainWarp(warp: number, x: number, y: number, z: number): DomainWarp
  multiScale(amplitude: number, frequency: number, amplitudeMultiplier: number, frequencyMultiplier: number, x: number, y: number, z: number): number
}
interface WalkerSetup extends Coordinate {
  maze: MazeInterface
  ran: RandomInterface
}
interface WalkerChances {
  straightChance: number
  turnChance: number
  branchChance: number
}
interface WalkerInstructions {
  startDirections: Movement
  branchDirections: Movement
  placementType: number
}
interface WalkerSettings {
  borderWrapping: boolean
  terminateOnContact: boolean
}
interface WalkerLimits {
  minLength: number
  maxLength: number
  minTurns: number
  maxTurns: number
  minBranches: number
  maxBranches: number
}
interface WalkerConfig {
  setup: WalkerSetup
  chances: WalkerChances
  instructions: WalkerInstructions
  settings: WalkerSettings
  limits: WalkerLimits
}
interface WalkerInterface extends Coordinate {
  readonly chances: WalkerChances
  readonly settings: WalkerSettings
  maze: MazeInterface
  ran: RandomInterface
  walk(type: number): void,
}
interface RandomWalkerInterface {
  maze: MazeInterface
  seedAmount: number
  ran: RandomInterface

  walkerChances: WalkerChances
  walkerInstructions: WalkerInstructions
  walkerSettings: WalkerSettings
  walkerLimits: WalkerLimits
  seeds: Array<Coordinate>

  init(): void
}
interface Turbulence {
  power: number
  size: number
}
interface NoiseInterface {
  maze: MazeInterface
  ran: RandomInterface
  readonly perlin: ImprovedNoiseInterface
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
interface RandomWalkerInterface {
  maze: MazeInterface
  readonly seedAmount: number
  ran: RandomInterface

  readonly walkerChances: WalkerChances
  readonly walkerInstructions: WalkerInstructions
  readonly walkerSettings: WalkerSettings
  readonly walkerLimits: WalkerLimits

  init(): void
}

// firebase
interface FirebaseDatabaseInterface {
  readonly collection: CollectionReference
  readonly doc: DocumentReference

  cd(dir: string): this
  mkdir(name: string, data?: object): Promise<DocumentReference>
  cat(name?: string): Promise<DocumentSnapshot | DocumentReference>
  getdoc(name: string): DocumentReference
  write(data: object): Promise<this>
  rm(name?: string): Promise<this>
}

interface OperationInterface {
  readonly type: string
  readonly ref: DocumentReference
  readonly data: object
}

// events
interface Observer {
  readonly id: Events
  readonly active: boolean
  readonly react: Function
}
interface EventObserversInterface {
  create: Observer
  add: Observer
  remove: Observer
}
interface FireStorageInterface {
  cd(dir: string): this
  rm(name?: string): Promise<this>
  upload(url: string, fileName?: string): Promise<string>
}

interface Interpolation {
  readonly frameDuration: number
  readonly type: typeof Ease[keyof typeof Ease]
}
interface InterpolatorInterface extends Interpolation {
  readonly type: typeof Ease[keyof typeof Ease]
  readonly frameDuration: number
  get(frame: number): NumberRange<0, 1>
}
interface GifStreamInterface {
  cursor: number
  contents: Uint8Array
  buffer: ArrayBufferLike
  reset(): void
  bytes(): Uint8Array
  bytesView(): Uint8Array
  writeByte(byte: number): void
  writeBytes(data: Array<number>, offset?: number, byteLength?: number): void
  writeBytesView(data: Uint8Array, offset: number, byteLength: number): void
  expand(newCapacity: number): void
}
interface DataPoint {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly data: any
}
interface OctreeInterface {
  boundaries: Array<OctreeInterface>
  points: Array<DataPoint>

  inBounds(point: DataPoint): boolean
  insert(point: DataPoint): void
  insertDataSet(points: Array<DataPoint>): void
  flatten(node?: OctreeInterface): Array<DataPoint>
}
interface CardData extends Coordinate {
  readonly suit: Suit
  readonly rank: PlayingCard
  x: number
  y: number
  xTarget: number
  yTarget: number
  delay: number
  interpolation: InterpolatorInterface
  facing: number
}
interface GameInterface {
  playerCards: Array<CardData>
  dealerCards: Array<CardData>
  deck: Array<CardData>
  shuffleDeck(): void
  hit(who: 'player' | 'dealer'): CardData
  sumCards(cards: Array<CardData>): number
  busted(sum: number): boolean
}
interface TableInterface {
  readonly amount: number
  readonly game: GameInterface
  initialAnimation(user: User): Promise<Buffer>
  hitAnimation(user: User, who: 'player' | 'dealer'): Promise<Buffer>
  getAttachment(c: NodeCanvasInterface): AttachmentBuilder
}
interface HashTable {
  table: Array<Array<number>>
  buckets: Object
}
interface LSHInterface {
  hashTables: Array<HashTable>
  reset(): this
  ann(str: string): Array<string>
  insertData(data: Array<string>): this
}
interface ColorInterface {
  hex: string
  rgb: RGBTuple
  rgba: RGBAQuaple
  red: RGBValue
  green: RGBValue
  blue: RGBValue
  lab: LABTuple
  luminosity: LuminosityValue
  chromaticA: ChromaticValue
  chromaticB: ChromaticValue
  hsv: HSVTuple
  hue: Hue
  saturation: Saturation
  value: Value
  alpha: RGBValue
  setRGB(rgb: RGBTuple, alpha?: RGBValue): this
  setHex(hex: string): this
  setLAB(lab: LABTuple): this
  getHSV(): this
  rotateHue(hue: number): this
  rotateSaturation(saturation: number): this
  rotateValue(value: number): this
}

interface XPData {
  level: number
  xp: number
  cooldown: number
}
interface LootLeague {
  score: number
  shield_end: number
}
interface DiscordUserData {
  neutrino_id: string

  avatar: string
  avatar_decoration: string
  banner: string
  creation_date: number
  display_name: string
  id: string
  username: string

  xp_data: XPData
  loot_league: LootLeague
  role_persist: Array<string>

  db_timestamp: number
  prng: Quaple<number>
}

interface DatabaseActions {
  instance: User | Guild
  id: string
  updateField(field: DataKeys, data: unknown): Promise<void> | void
  updateFieldValue(field: DataKeys, key: DataKeys, data: unknown): Promise<void> | void
  setField(field: DataKeys, data: unknown): Promise<void> | void
  setFieldValue(field: DataKeys, key: string, data: unknown): Promise<void> | void
  union(field: DataKeys, elements: Array<unknown>): Promise<void>
  remove(field: DataKeys, elements: Array<unknown>): Promise<void>
  removeFieldValue(field: DataKeys, name: string): Promise<void> | void
}

interface DatabaseUserInstance extends FirebaseInstanceInterface {
  ran: RandomInterface
  data: DiscordUserData
  xp: number
  level: number
  cooldown: number
  score: number
  shieldEnd: number
  rolePersist: Set<string>
  neutrinoId: string
  setShield(state: number): Promise<void>
  setScore(amount: number): Promise<void>
  setXP(amount: number): Promise<void>
  xpCooldown(length: number): Promise<void>
  setLevel(level: number): Promise<void>
  passiveXP(): Promise<void>
  applyRolePersist(role: string): Promise<void>
  removeRolePersist(role: string): Promise<void>
}

interface DiscordGuildData {
  leaderboard: Array<string>
  neutrino_guild_id: string
  owner_id: string
  icon: string
  creation_date: number
  id: string
  role_persist: Array<string>
  db_timestamp: number
  prng: Quaple<number>
  ignored_channels: Array<string>
}

interface DatabaseGuildInstance extends FirebaseInstanceInterface {
  leaderboard: BinaryHeapInterface<string>
  data: DiscordGuildData
  ran: RandomInterface
  rolePersist: Set<string>
  ignoredChannels: Set<string>
  id: string
  db_timestamp: number
  neutrinoGuildId: string
  refreshLeaderboard(): Promise<void>
  addRolePersist(role: string): Promise<void>
  removeRolePersist(role: string): Promise<void>
  addIgnoredChannel(channel: string): Promise<void>
  removeIgnoredChannel(channel: string): Promise<void>
}

interface FirebaseInstanceInterface extends DatabaseActions {
  fetch(): Promise<void>
  create(): Promise<DocumentReference>
  random(n: number = 1.0): Promise<number>
  randomInt(n: number = 1.0): Promise<number>
  fromRange(min: number, max: number, type: 'Integer' | 'Float' = 'Integer'): Promise<number>
}

interface JSONDatabase {
  readonly version: number
  readonly users: {
    [key: string]: DiscordUserData
  }
  readonly guilds: {
    [key: string]: DiscordGuildData
  }
  leaderboard: Array<string>
  members: Array<string>
}

interface JSONDatabaseInterface {
  refresh(): void
  read(): JSONDatabase
  get version(): number
}

interface JSONDBInstanceInterface extends DatabaseActions {
  fetch(): void
  create(): DiscordUserData | DiscordGuildData
  random(n: number = 1.0): number
  randomInt(n: number = 1.0): number
  fromRange(min: number, max: number, type: 'Integer' | 'Float' = 'Integer'): number
}

interface BinaryHeapInterface<T> {
  heap: Array<T>
  get size(): number
  get first(): T
  get last(): T
  pop(): T
  insert(value: T): void
  push(value: T): number
  has(value: T): boolean
  updateValue(oldValue: T, newValue: T): void
  build(data: Array<T>): this
  refresh(): Array<T>
  belongs(value: T): boolean
}
