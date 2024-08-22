import global from 'global'

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
  apiKey: global.env.FIREBASE_API_KEY,
  authDomain: global.env.FIREBASE_AUTH_DOMAIN,
  projectId: global.env.FIREBASE_PROJECT_ID,
  storageBucket: global.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: global.env.FIREBASE_MESSAGE_SENDER_ID,
  appId: global.env.FIREBASE_APP_ID,
  measurementId: global.env.FIREBASE_MEASUREMENT_ID,
}

export default config
