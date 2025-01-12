import {
  Message,
  Events,
  Collection,
  Snowflake,
  PartialMessage,
} from 'discord.js'

export default {
  id: Events.MessageBulkDelete,

  async react(bot: BotInterface, messages: Collection<Snowflake, Message | PartialMessage>): Promise<void> {

  }
}
