import * as util from './util.js'
import Log from './log.js'

const Build: BuildInterface = {
  id: 'unknown',
  date: '',
  message: '',
  diff: '',
  async load(): Promise<void> {
    if (process.env.NODE_ENV === 'DEV') return
    try {
      let response: Response = await fetch('https://api.github.com/repos/lunacles/neutrino/commits/main')
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
