import { Events } from "discord.js"

interface Observer {
  eventID: Events
  active: boolean
  react: Function
}

export default Observer
