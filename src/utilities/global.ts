import Build from "./repo"

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

interface Direction {
  none: number
  left: number
  right: number
  up: number
  down: number
}

interface DiagonalDirection {
  upLeft: number
  downLeft: number
  upRight: number
  downRight: number
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

interface GlobalInterface {
  build: any
  ownerId: string
  testServerId: string
  loggingConfig: LoggingConfigInterface
  cooldown: CommandCooldownInterface
  shieldDuration: number
  direction: Direction
  diagonalDirection: DiagonalDirection
  movementOptions: MovementOptions
}

const global: GlobalInterface = {
  build: Build,
  ownerId: '342038795757027329',
  testServerId: '1120372465252700331',
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
}

export default global
