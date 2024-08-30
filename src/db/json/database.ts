import fs from 'fs'
import path from 'path'
import Log from '../../utilities/log.js'
import { fileURLToPath } from 'url'

const JSONDatabase = class implements JSONDatabaseInterface {
  private path: string
  public static data: JSONDatabase
  private refreshRate: number
  constructor() {
    this.path = path.join(path.dirname(fileURLToPath(import.meta.url)), './db.json')
    this.refreshRate = 5e3//1e3 * 60 * 10 // 10 minutes
  }
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
