import { Guild, User } from 'discord.js'
import JSONDatabase from './database.js'
import * as util from '../../utilities/util.js'

const JSONAction = class implements DatabaseActions {
  public instance: User | Guild
  public id: string
  constructor(instance: User | Guild) {
    this.instance = instance
    this.id = instance.id
  }
  public updateField(field: Keys<DiscordUserData>, data: unknown): void {
    JSONDatabase.data.users[this.id][field] = data
  }
  public updateFieldValue(field: Keys<DiscordUserData>, key: Keys<DiscordUserData>, data: unknown): void {
    JSONDatabase.data.users[this.id][field][key] = data
  }
  public setField(field: Keys<DiscordUserData>, data: unknown): void {
    JSONDatabase.data.users[this.id][field] = data
  }
  public setFieldValue(field: Keys<DiscordUserData>, key: Keys<DiscordUserData>, data: unknown): void {
    JSONDatabase.data.users[this.id][field][key] = data
  }
  public removeFieldValue(field: Keys<DiscordUserData>, key: Keys<DiscordUserData>): void {
    delete JSONDatabase.data.users[this.id][field][key]
  }
  public async union(field: DataKeys, elements: Array<unknown>): Promise<void> {
    JSONDatabase.data.users[this.id][field] = [...JSONDatabase.data.users[this.id][field], ...elements]
  }
  public async remove(field: DataKeys, element: unknown): Promise<void> {
    util.remove(JSONDatabase.data.users[this.id][field], element)
  }
}

export default JSONAction
