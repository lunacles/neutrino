import {
  Events,
  GuildMember,
  PartialGuildMember,
} from 'discord.js'

export default {
  id: Events.GuildMemberUpdate,

  async react(bot: BotInterface, oldMember: GuildMember | PartialGuildMember, newMember: GuildMember): Promise<void> {
    // if the user is a bot, ignore them
    if (oldMember.user.bot || newMember.user.bot) return

  }
}
