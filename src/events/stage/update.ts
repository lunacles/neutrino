import {
  Events,
  StageInstance,
} from 'discord.js'

export default {
  id: Events.StageInstanceUpdate,

  async react(bot: BotInterface, oldStageInstance: StageInstance | null, newStageInstance: StageInstance): Promise<void> {

  }
}
