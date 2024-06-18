import dotenv from 'dotenv'
dotenv.config()
import Build from 'utilities/repo'

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

const Direction: Direction = {
  none: 0,  // 0000
  left: 1,  // 0001
  right: 2, // 0010
  up: 4,    // 0100
  down: 8,  // 1000
}

const DiagonalDirections: DiagonalDirection = {
  upLeft: Direction.left | Direction.up,
  downLeft: Direction.left | Direction.down,
  upRight: Direction.right | Direction.up,
  downRight: Direction.right | Direction.down
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
}

const envVar = (key: string): string => process.env[`${process.env.NODE_ENV}_${key}`]

interface GlobalInterface {
  readonly build: any
  readonly ownerId: string
  readonly testServerId: string
  readonly cooldown: CommandCooldownInterface
  readonly shieldDuration: number
  direction: Direction
  diagonalDirection: DiagonalDirection
  movementOptions: MovementOptions
  readonly batchTick: number
  readonly errorTraceChannel: string
  readonly commandChannels: CommandChannels
  readonly env: ENV
}

const global: GlobalInterface = {
  build: Build,
  ownerId: '342038795757027329',
  testServerId: '954026848361254993',
  cooldown: {
    score: 5,        // 5sec
    claim: 30,       // 30sec
    steal: 60 * 2,   // 2min
    gamble: 60,      // 1min
    shield: 60 * 60, // 1hr
    leaderboard: 30, // 30sec
    blackjack: 60,   // 1min
  },
  shieldDuration: 60 * 30, // 30min
  direction: Direction,
  diagonalDirection: DiagonalDirections,
  movementOptions: {
    all: [
      Direction.left, Direction.right,
      Direction.up, Direction.down,
      DiagonalDirections.upLeft, DiagonalDirections.upRight,
      DiagonalDirections.downLeft, DiagonalDirections.downRight,
    ],
    diagonal: [
      DiagonalDirections.upLeft, DiagonalDirections.upRight,
      DiagonalDirections.downLeft, DiagonalDirections.downRight,
    ],
    vertical: [
      Direction.up, Direction.down
    ],
    horizontal: [
      Direction.left, Direction.right
    ],
  },
  batchTick: 60e3,
  errorTraceChannel: '1244402813870669885',
  commandChannels: {
    lootLeague: '1227836204087640084',
    mazeGeneration: '1244869387991781428',
    misc: '1244869433911152690'
  },
  env: {
    FIREBASE_API_KEY: envVar('FIREBASE_API_KEY'),
    FIREBASE_AUTH_DOMAIN: envVar('FIREBASE_AUTH_DOMAIN'),
    FIREBASE_PROJECT_ID: envVar('FIREBASE_PROJECT_ID'),
    FIREBASE_STORAGE_BUCKET: envVar('FIREBASE_STORAGE_BUCKET'),
    FIREBASE_MESSAGE_SENDER_ID: envVar('FIREBASE_MESSAGE_SENDER_ID'),
    FIREBASE_APP_ID: envVar('FIREBASE_APP_ID'),
    FIREBASE_MEASUREMENT_ID: envVar('FIREBASE_MEASUREMENT_ID'),
    BOT_TOKEN: envVar('BOT_TOKEN'),
    BOT_CLIENT_ID: envVar('BOT_CLIENT_ID'),
  }
}

export default global
