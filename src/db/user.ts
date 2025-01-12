import FirebaseUserInstance from './firebase/user.js'
import { User } from 'discord.js'

const UserInstance = class extends FirebaseUserInstance implements DatabaseUserInstance {
  constructor(user: User) {
    super(user)
  }
  public async appendBan(info: BanInfo): Promise<void> {
    console.log('sending ban', info)
    await this.union('bans', [info])
    this.bans.push(info)
  }
}

export default UserInstance
