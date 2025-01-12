import {
  Events,
  Role,
} from 'discord.js'

export default {
  id: Events.GuildRoleUpdate,

  async react(bot: BotInterface, oldRole: Role, newRole: Role): Promise<void> {

  }
}
