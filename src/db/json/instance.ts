import { User } from 'discord.js'
import JSONDatabase from './database'
import Secret from 'utilities/secret'

const JSONDBInstance = class implements JSONDBInstanceInterface {
  protected user: User
  constructor(user: User) {

    this.user = user
  }
  public updateField(field: Keys<DiscordUserData>, data: unknown): void {
    JSONDatabase.data.users[this.user.id][field] = data
  }
  public updateFieldValue(field: Keys<DiscordUserData>, key: Keys<DiscordUserData>, data: unknown): void {
    JSONDatabase.data.users[this.user.id][field][key] = data
  }
  public setField(field: Keys<DiscordUserData>, data: unknown): void {
    JSONDatabase.data.users[this.user.id][field] = data
  }
  public setFieldValue(field: Keys<DiscordUserData>, key: Keys<DiscordUserData>, data: unknown): void {
    JSONDatabase.data.users[this.user.id][field][key] = data
  }
  public removeFieldValue(field: Keys<DiscordUserData>, key: Keys<DiscordUserData>): void {
    delete JSONDatabase.data.users[this.user.id][field][key]
  }
  public fetch(): DiscordUserData {
    let record: DiscordUserData = JSONDatabase.data.users[this.user.id]
    record ??= this.createRecord(this.user)
    return record
  }
  private createRecord(user: User): DiscordUserData {
    JSONDatabase.data.users[user.id] = {
      avatar: user.avatarURL() ?? user.defaultAvatarURL,
      avatar_decoration: user.avatarDecorationURL(),
      banner: user.bannerURL(),
      creation_date: user.createdTimestamp,
      display_name: user.displayName,
      id: user.id,
      username: user.username,

      xp_data: {
        level: 0,
        xp: 0,
        cooldown: 0,
      },
      loot_league: {
        score: 0,
        shield_end: 0,
      },
      role_persist: {},
      db_timestamp: Math.floor(Date.now()),

      prng: ((): Quaple<number> => {
        let hash = Secret.hash(user.id)
        let seeds = []
        for (let i = 0; i < 4; i++)
          // treated it as unsigned 32-bit integer
          seeds.push(parseInt(hash.substring(i * 8, (i + 1) * 8), 16) >>> 0)

        return seeds as Quaple<number>
      })()
    }
    return JSONDatabase.data.users[user.id]
  }
}

export default JSONDBInstance
