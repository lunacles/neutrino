interface LoggingConfigInterface {
  avatars: boolean
  banners: boolean
  usernames: boolean
  displayNames: boolean
  nicknames: boolean
  servers: boolean
  messages: boolean
  presence: boolean
}

interface GlobalInterface {
  ownerId: string
  loggingConfig: LoggingConfigInterface
}

const global: GlobalInterface = {
  ownerId: '342038795757027329',
  loggingConfig: {
    avatars: true,
    banners: true,
    usernames: true,
    displayNames: true,
    nicknames: true,
    servers: true,
    messages: false,
    presence: true,
  },
}

export default global
