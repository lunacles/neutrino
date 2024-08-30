import dotenv from 'dotenv'
dotenv.config()
import Build from './utilities/repo.js'

const envVar = (key: string): string => process.env[`${process.env.NODE_ENV}_${key}`]
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
    blackjack: 30,   // 1min
  },
  cooldowns: new Map<string, CommandCooldownInterface>(),
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
  },
  botId: '1195601709909692486',
  database: null,
  rolePersistCap: 10,
  prefix: '!$',
}

export default global
