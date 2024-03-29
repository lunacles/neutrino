interface LoggingConfigInterface {
  avatars: boolean
  banners: boolean
  usernames: boolean
  displayNames: boolean
  nicknames: boolean
  servers: boolean
  messages: boolean
  presence: boolean
  roles: boolean
}

interface GlobalInterface {
  ownerId: string
  arrasDiscordId: string
  loggingConfig: LoggingConfigInterface
}

const global: GlobalInterface = {
  ownerId: '342038795757027329',
  arrasDiscordId: '366661839620407297',
  loggingConfig: {
    avatars: true,
    banners: true,
    usernames: true,
    displayNames: true,
    nicknames: true,
    servers: true,
    messages: false,
    presence: true,
    roles: true,
  },
}

export default global
