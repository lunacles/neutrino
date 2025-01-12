import {
  Collection,
  Events,
  Guild,
  GuildMember,
  Snowflake,
} from 'discord.js'

export default {
  id: Events.GuildMembersChunk,

  async react(
    bot: BotInterface,
    members: Collection<Snowflake, GuildMember>,
    guild: Guild,
    data: { count: number; index: number; nonce: string | undefined }
  ): Promise<void> {

  }
}
