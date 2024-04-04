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
  shieldDuration: number
}

const global: GlobalInterface = {
  ownerId: '342038795757027329',
  arrasDiscordId: '366661839620407297',
  loggingConfig: {
    avatars: false,
    banners: false,
    usernames: true,
    displayNames: true,
    nicknames: true,
    servers: true,
    messages: false,
    presence: true,
    roles: true,
  },
  cooldown: {
    score: 5,        // 5sec
    claim: 30,       // 30sec
    steal: 60 * 2,   // 2min
    gamble: 60,      // 1min
    shield: 60 * 60, // 1hr
    leaderboard: 30  // 30sec
  },
  shieldDuration: 60 * 30 // 30min,
}

export default global
