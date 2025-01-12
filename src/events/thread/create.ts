import {
  Events,
  ThreadChannel,
} from 'discord.js'

export default {
  id: Events.ThreadCreate,
  async react(bot: BotInterface, thread: ThreadChannel): Promise<void> {

  }
}
