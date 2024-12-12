import config from '../config.js'
import JSONUserInstance from './json/user.js'
import FirebaseUserInstance from './firebase/user.js'
import { User } from 'discord.js'
import Log from '../utilities/log.js'
import Database from './database.js'

const xpReward: Pair<number> = [15, 25]
const cooldown: number = 1e3 * 5//60 // 60 seconds

const Type = (config.databaseType === 'json' ? JSONUserInstance : FirebaseUserInstance) as {
  new (user: User): ConfigInterface['databaseType'] extends 'json' ? JSONDBInstanceInterface : FirebaseInstanceInterface
}
const UserInstance = class extends Type implements DatabaseUserInstance {
  public data: DiscordUserData
  public prng: Function
  public ran: RandomInterface
  public xp: number
  public level: number
  public cooldown: number
  public score: number
  public shieldEnd: number
  public rolePersist: Set<string>
  public neutrinoId: string
  constructor(user: User) {
    super(user)
  }
  // Set our shield for loot league
  public async setShield(state: number): Promise<void> {
    await this.updateFieldValue('loot_league', 'shield_end',  state)
    this.shieldEnd = state
  }
  // Set our score for loot league
  public async setScore(amount: number): Promise<void> {
    await this.updateFieldValue('loot_league', 'score',  amount)
    this.score = amount
  }
  // Set our XP for chat leveling
  public async setXP(amount: number): Promise<void> {
    await this.updateFieldValue('xp_data', 'xp',  amount)
    this.xp = amount
  }
  // Set our XP cooldown for chat leveling
  public async xpCooldown(length: number): Promise<void> {
    let time: number = Date.now() + length
    await this.updateFieldValue('xp_data', 'cooldown',  time)
    this.cooldown = time
  }
  // Calculate our level from our XP
  public levelFromXP(level: number): number {
    return 1.6667 * level ** 3 + 22.5 * level ** 2 + 75.8333 * level
  }
  // Set our level for chat leveling
  public async setLevel(level: number): Promise<void> {
    let xp = this.levelFromXP(level)
    await this.updateFieldValue('xp_data', 'level',  level)
    this.setXP(xp)
    this.level = level
  }
  // Passively give us XP
  public async passiveXP(): Promise<void> {
    // If we're no longer on cooldown, reward us
    if (Date.now() / 1e3 > this.cooldown / 1e3) {
      // Give us a random amount from our desired XP range
      this.xp += this.ran.fromRange(...xpReward).asInteger()

      // Level us up if we're eligible to
      if (this.xp > Math.round(this.levelFromXP(this.level + 1))) {
        await this.setLevel(this.level + 1)
        Log.info(`User with id "${this.id}" leveled up to ${this.level}`)
      } else {
        this.setXP(this.xp)
      }
      // Reset our cooldown
      await this.xpCooldown(cooldown)
    }
  }
  // Apply a role persist to our account
  public async applyRolePersist(role: string): Promise<void> {
    Database.discord.users.cache.get(this.id).rolePersist.add(role)
    await this.union('role_persist', [role])
  }
  // Remove a role persist from our account
  public async removeRolePersist(role: string): Promise<void> {
    Database.discord.users.cache.get(this.id).rolePersist.add(role)
    await this.remove('role_persist', [role])
  }
}

export default UserInstance
