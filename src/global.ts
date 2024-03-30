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

interface CommandCooldownInterface {
  score: number
  claim: number
  steal: number
  gamble: number
  shield: number
  leaderboard: number
}

interface GlobalInterface {
  ownerId: string
  arrasDiscordId: string
  loggingConfig: LoggingConfigInterface
  cooldown: CommandCooldownInterface
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
  cooldown: {
    score: 30,       // 30sec
    claim: 60 * 10,  // 10min
    steal: 60 * 5,   // 5min
    gamble: 60 * 5,  // 5min
    shield: 60 * 40, // 40min
    leaderboard: 30  // 30sec
  }
}

export default global
