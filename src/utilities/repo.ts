import * as util from './util.js'
import Log from './log.js'

interface BuildInterface {
  id: string
  date: string
  message: string
  diff: string
  load(): Promise<void>
}

const Build: BuildInterface = {
  id: 'unknown',
  date: '',
  message: '',
  diff: '',
  async load(): Promise<void> {
    try {
      let response: Response = await fetch('https://api.github.com/repos/lunacles/eulaquery/commits/main')
      if (!response.ok)
        throw new Error(`HTTP error: ${response.status}`)

      let json = await response.json()
      Build.id = json.sha.slice(0, 7)
      Build.message = json.commit.message
      Build.diff = json.html_url
      Build.date = util.formatDate(json.commit.author.date)
    } catch (err) {
      Log.error(`Failed to load commit data`, err)
    }
  },
}

export default Build
