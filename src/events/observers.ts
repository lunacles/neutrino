import fs from 'fs/promises'
import path from 'path'
import Log from '../utilities/log.js'
import { fileURLToPath } from 'url'

const locate = async (folder: string): Promise<Array<[string, string]>> => {
  let directory = path.join(path.dirname(fileURLToPath(import.meta.url)), folder)
  return (await fs.readdir(directory)).map(f => [directory, f])
}

const compile = async (name: string): Promise<Array<EventObserver>> => {
  const events: Array<EventObserver> = []

  for (let file of await locate(name)) {
    try {
      let module = await import(path.join(...file))
      let event = module.default

      events.push(event)
    } catch (err) {
      Log.error(`Failed to compile event file "${file}"`, err)
    }
  }

  return events
}

const EventObservers: Array<EventObserver> = []

for (let event of [
  ...(await compile('ban')),
  ...(await compile('channel')),
  ...(await compile('emoji')),
  ...(await compile('event')),
  ...(await compile('invite')),
  ...(await compile('member')),
  ...(await compile('message')),
  ...(await compile('reaction')),
  ...(await compile('role')),
  ...(await compile('stage')),
  ...(await compile('sticker')),
  ...(await compile('thread')),
  ...(await compile('user')),
  ...(await compile('voice')),
  ...(await compile('webhooks')),
]) {
  EventObservers.push(event)
}

export default EventObservers
