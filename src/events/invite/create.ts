import {
  Events,
  Invite,
} from 'discord.js'

export default {
  id: Events.InviteCreate,

  async react(bot: BotInterface, invite: Invite): Promise<void> {

  }
}
