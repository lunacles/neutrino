import {
  Events,
  ThreadMember,
} from 'discord.js'

export default {
  id: Events.ThreadMembersUpdate,
  async react(bot: BotInterface, oldMember: ThreadMember, newMember: ThreadMember): Promise<void> {
    // if the user is a bot, ignore them
    if (oldMember.user.bot || newMember.user.bot) return

  }
}
