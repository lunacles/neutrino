import {
  Events,
  ThreadChannel,
} from 'discord.js'

export default {
  id: Events.ThreadUpdate,
  async react(bot: BotInterface, oldThread: ThreadChannel, newThread: ThreadChannel): Promise<void> {

  }
}
