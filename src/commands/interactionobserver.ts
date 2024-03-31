import {
  CommandInteraction,
  GuildBasedChannel,
  ChannelType,
  Collection,
} from 'discord.js'

interface InteractionObserver {
  interaction: CommandInteraction
  filter: Array<any>

  filterChannels: () => this
  byChannelType: (type: ChannelType) => this
  byExactName: (name: string) => this
  byNameQuery: (query: string) => this
  byParentId: (parentId: string) => this
}

const InteractionObserver = class InteractionObserver {
  static abortReasons = new Map([
    [0, 'You have insufficient permissions to run this command!'],
    [1, 'Command unavailable'],
    [2, 'Invalid channel type'],
    [3, 'Command is not available in this server'],
    [4, 'The selected user cannot be yourself'],
  ])
  public interaction: CommandInteraction
  public filter: Collection<string, GuildBasedChannel>
  constructor(interaction: CommandInteraction) {
    this.interaction = interaction

    this.filter = new Collection()
  }
  filterChannels(): this {
    this.filter = this.interaction.guild.channels.cache
    return this
  }
  byChannelType(type: ChannelType): this {
    this.filter = this.filter.filter((channel: GuildBasedChannel) => channel.type === type)
    return this
  }
  byExactName(name: string): this {
    this.filter = this.filter.filter((channel: GuildBasedChannel) => channel.name.toLowerCase() === name.toLowerCase())
    return this
  }
  byNameQuery(query: string): this {
    this.filter = this.filter.filter((channel: GuildBasedChannel) => channel.name.toLowerCase().includes(query.toLowerCase()))
    return this
  }
  byParentId(parentId: string): this {
    this.filter = this.filter.filter((channel: GuildBasedChannel) => channel.parentId === parentId)
    return this
  }
  finishFilter(): Collection<string, GuildBasedChannel> {
    let filter: Collection<string, GuildBasedChannel> = this.filter.clone()
    this.filter.clear()
    return filter
  }
  async abort(code: number): Promise<void> {
    await this.interaction.editReply(`${InteractionObserver.abortReasons.get(code)} (Error code ${code})`)
  }
}

export default InteractionObserver
