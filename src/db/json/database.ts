import fs from 'fs'
import path from 'path'
import Log from '../../utilities/log.js'
import { fileURLToPath } from 'url'

// Honestly not recommended to use this but if you're poor then whatever
// For small servers you can still use a firebase db for like nothing tho
const JSONDatabase = class implements JSONDatabaseInterface {
  private path: string
  public static data: JSONDatabase
  private refreshRate: number
  constructor() {
    this.path = path.join(path.dirname(fileURLToPath(import.meta.url)), './db.json')
    this.refreshRate = 1e3 * 60 * 10 // 10 minutes
  }
  // Read the database
  // TODO: If it can like, not read everything at once that'd be great
  public read(): JSONDatabase {
    try {
      let data = fs.readFileSync(this.path, 'utf8')

      setInterval(() => this.refresh(), this.refreshRate)

      return JSON.parse(data) satisfies JSONDatabase
    } catch (err) {
      Log.error('Error reading the database:', err)
      return null
    }
  }
  // TODO: If it can like, not refresh everything at once that'd be great
  public refresh(): void {
    try {
      fs.writeFileSync(this.path, JSON.stringify(JSONDatabase.data, null, 4), 'utf8')
    } catch (err) {
      Log.error('Error writing to the database:', err)
    }
  }
  public get version(): number {
    return JSONDatabase.data.version
  }
}

export default JSONDatabase
