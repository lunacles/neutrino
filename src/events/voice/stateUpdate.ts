import {
  Events,
  VoiceState,
} from 'discord.js'

export default {
  id: Events.VoiceStateUpdate,
  async react(bot: BotInterface, oldState: VoiceState, newState: VoiceState): Promise<void> {

  }
}
