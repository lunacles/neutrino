import {
  Events,
  GuildMember,
} from 'discord.js'

export default {
  id: Events.VoiceServerUpdate,
  async react(bot: BotInterface, member: GuildMember): Promise<void> {
    // if the user is a bot, ignore them
    if (member.user.bot) return

  }
}
