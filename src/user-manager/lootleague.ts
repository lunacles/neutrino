import {
  Collection,
  Role,
} from 'discord.js'
import {
  Database,
} from '../firebase/database.js'
import {
  UserDataInterface,
  Cooldown,
  ScoreGame,
  OperationType,
} from '../types.d.js'

type Cooldowns = 'score' | 'leaderboard' | 'claim' | 'steal' | 'gamble' | 'shield'

enum BaseScore {
  '878403773066784839' = 25,   // egg
  '839992302725234709' = 50,   // square
  '839992464831938580' = 100,  // triangle
  '839992547702734859' = 250,  // pentagon
  '839992638514004038' = 500,  // beta pentagon
  '839992726937534504' = 1e3,  // alpha pentagon
  '839992968869838849' = 2500, // gem
  '943590194278453274' = 5e3,  // jewel
  '1026052883768152145' = 1e4, // basic
}

const LootLeague = class LootLeagueInterface {
  public static async restore(user: UserDataInterface, data: ScoreGame): Promise<LootLeagueInterface> {
    let league = new LootLeague(user)
    league.score = data.score
    league.cooldown = data.cooldown
    league.shieldEnd = data.shieldEnd
    return league
  }
  public score: number
  public cooldown: Cooldown
  public shieldEnd: number
  public data: UserDataInterface
  constructor(data: UserDataInterface) {
    this.score = 0
    this.cooldown = {
      score: 0,
      leaderboard: 0,
      claim: 0,
      steal: 0,
      gamble: 0,
      shield: 0,
    }
    this.shieldEnd = null

    this.data = data
  }
  public setup(): ScoreGame {
    let roles: Collection<string, Role> = this.data.member.roles.cache.filter((role: Role): boolean => Object.keys(BaseScore).includes(role.id))
    let score: number = roles.size === 0 ? BaseScore['878403773066784839'] : BaseScore[
      [...roles.values()].reduce((highest: Role, current: Role): Role => BaseScore[current.id] > BaseScore[highest.id] ? current : highest).id
    ]

    return {
      score,
      cooldown: this.cooldown,
      shieldEnd: this.shieldEnd,
    }
  }
  public async setCooldown(type: Cooldowns, time: number): Promise<void> {
    this.data.operations.push({
      type: OperationType.Update,
      ref: this.data.guildCollection.ref,
      data: Database.structureData({
        [`lootleague.cooldown.${type}`]: time
      })
    })

    this.cooldown[type] = time
  }
  public async setScore(amount: number): Promise<void> {
    this.data.operations.push({
      type: OperationType.Update,
      ref: this.data.guildCollection.ref,
      data: Database.structureData({
        ['lootleague.score']: amount
      })
    })

    this.score = amount
  }
  public async setShield(state: number): Promise<void> {
    this.data.operations.push({
      type: OperationType.Update,
      ref: this.data.guildCollection.ref,
      data: Database.structureData({
        ['lootleague.shieldEnd']: state
      })
    })
    /*
    setTimeout(async (): Promise<void> => {
      await this.data.database.write(Database.structureData({
        ['lootleague.shieldEnd']: null
      }))
    }, global.shieldDuration * 1e3)
    */
    this.shieldEnd = state
  }
}

export default LootLeague
