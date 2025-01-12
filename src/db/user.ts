import FirebaseUserInstance from './firebase/user.js'
import { User } from 'discord.js'

const UserInstance = class extends FirebaseUserInstance implements DatabaseUserInstance {
  constructor(user: User) {
    super(user)
  }
    this.bans.push(info)
  }
}

export default UserInstance
