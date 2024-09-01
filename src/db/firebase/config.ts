import gconfig from '../../config.js'

interface Config {
  readonly apiKey: string
  readonly authDomain: string
  readonly projectId: string
  readonly storageBucket: string
  readonly messagingSenderId: string
  readonly appId: string
  readonly measurementId: string
}

const config: Config = {
  apiKey: gconfig.env.FIREBASE_API_KEY,
  authDomain: gconfig.env.FIREBASE_AUTH_DOMAIN,
  projectId: gconfig.env.FIREBASE_PROJECT_ID,
  storageBucket: gconfig.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: gconfig.env.FIREBASE_MESSAGE_SENDER_ID,
  appId: gconfig.env.FIREBASE_APP_ID,
  measurementId: gconfig.env.FIREBASE_MEASUREMENT_ID,
}

export default config
