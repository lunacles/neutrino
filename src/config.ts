import dotenv from 'dotenv'
dotenv.config()
import Build from './utilities/repo.js'

const envVar = (key: string): string => process.env[`${process.env.NODE_ENV}_${key}`]

const devConfig: DevConfig = Object.freeze({
  ownerId: '342038795757027329',
  botId: '1195601709909692486',
  testServerId: '954026848361254993',
  errorTraceChannel: '1244402813870669885',
  prefix: '!$',
  build: Build,
  heartbeatInterval: 30e3,
})

const lootLeagueConfig: LootLeagueConfig = Object.freeze({
  cooldown: {
    score: 5,        // 5sec
    claim: 30,       // 30sec
    steal: 60 * 2,   // 2min
    gamble: 60,      // 1min
    shield: 60 * 60, // 1hr
    leaderboard: 30, // 30sec
    blackjack: 30,   // 1min
  },
  shieldDuration: 60 * 30, // 30min
})

const dbConfig: DBConfig = Object.freeze({
  databaseType: 'firebase',
  batchTick: 60e3,
  rolePersistCap: 10,
})

const env: ENV = {
  FIREBASE_API_KEY: envVar('FIREBASE_API_KEY'),
  FIREBASE_AUTH_DOMAIN: envVar('FIREBASE_AUTH_DOMAIN'),
  FIREBASE_PROJECT_ID: envVar('FIREBASE_PROJECT_ID'),
  FIREBASE_STORAGE_BUCKET: envVar('FIREBASE_STORAGE_BUCKET'),
  FIREBASE_MESSAGE_SENDER_ID: envVar('FIREBASE_MESSAGE_SENDER_ID'),
  FIREBASE_APP_ID: envVar('FIREBASE_APP_ID'),
  FIREBASE_MEASUREMENT_ID: envVar('FIREBASE_MEASUREMENT_ID'),
  BOT_TOKEN: envVar('BOT_TOKEN'),
  BOT_CLIENT_ID: envVar('BOT_CLIENT_ID'),
  NODE_ENV: envVar('NODE_ENV'),
}

const config: ConfigInterface = {
  ...devConfig,
  ...lootLeagueConfig,
  ...dbConfig,
  env,
}

export default config
