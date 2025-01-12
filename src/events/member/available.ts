import {
  Events,
  GuildMember,
  PartialGuildMember,
} from 'discord.js'

export default {
  id: Events.GuildMemberAvailable,

  async react(bot: BotInterface, member: GuildMember | PartialGuildMember): Promise<void> {
    // if the user is a bot, ignore them
    if (member.user.bot) return

  }
}
