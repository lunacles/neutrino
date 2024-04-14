import {
  CommandInteraction,
  GuildBasedChannel,
  ChannelType,
  Collection,
  PermissionsBitField,
  GuildChannel,
  GuildTextBasedChannel,

  CacheType,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
  RoleSelectMenuInteraction,
  MentionableSelectMenuInteraction,
  ChannelSelectMenuInteraction,
  ButtonInteraction,
} from 'discord.js'

type Action = StringSelectMenuInteraction<CacheType> | UserSelectMenuInteraction<CacheType> | RoleSelectMenuInteraction<CacheType> | MentionableSelectMenuInteraction<CacheType> | ChannelSelectMenuInteraction<CacheType> | ButtonInteraction<CacheType>

interface InteractionObserver {
  interaction: CommandInteraction
  filter: Array<any>

  filterChannels(): this
  byChannelType(type: ChannelType): this
  byExactName(name: string): this
  byNameQuery(query: string): this
  byParentId(parentId: string): this
  finishFilter(): Collection<string, GuildBasedChannel>
  componentsFilter(components: Array<string>): (component: Action) => boolean
  checkPermissions(permissions: Array<bigint>, channel: GuildChannel): boolean
  abort(code: number): Promise<void>
}

const InteractionObserver = class InteractionObserver {
  static abortReasons = new Map([
    [0, 'You have insufficient permissions to run this command'],
    [1, 'Command unavailable'],
    [2, 'Invalid channel type'],
    [3, 'Command is not available in this server'],
    [4, 'The selected user cannot be yourself'],
    [5, 'This command can only be used in <#1227836204087640084>'],
    [6, 'Selected channel does not support permission overwrites']
  ])
  public interaction: CommandInteraction
  public filter: Collection<string, GuildBasedChannel>
  constructor(interaction: CommandInteraction) {
    this.interaction = interaction

    this.filter = new Collection()
  }
  public filterChannels(): this {
    this.filter = this.interaction.guild.channels.cache
    return this
  }
  public byChannelType(type: ChannelType): this {
    this.filter = this.filter.filter((channel: GuildBasedChannel) => channel.type === type)
    return this
  }
  public byExactName(name: string): this {
    this.filter = this.filter.filter((channel: GuildBasedChannel) => channel.name.toLowerCase() === name.toLowerCase())
    return this
  }
  public byNameQuery(query: string): this {
    this.filter = this.filter.filter((channel: GuildBasedChannel) => channel.name.toLowerCase().includes(query.toLowerCase()))
    return this
  }
  public byParentId(parentId: string): this {
    this.filter = this.filter.filter((channel: GuildBasedChannel) => channel.parentId === parentId)
    return this
  }
  public finishFilter(): Collection<string, GuildBasedChannel> {
    let filter: Collection<string, GuildBasedChannel> = this.filter.clone()
    this.filter.clear()
    return filter
  }
  public componentsFilter(components: Array<string>): (component: Action) => boolean {
    return (component: Action): boolean => components.includes(component.customId) && component.user.id === this.interaction.user.id
  }
  public checkPermissions(permissions: Array<bigint>, channel: GuildChannel | GuildTextBasedChannel): boolean {
    const memberPermissions: Readonly<PermissionsBitField> = channel.permissionsFor(this.interaction.member.user.id)
    if (!memberPermissions) return false
    for (let permission of permissions)
      if (!memberPermissions.has(permission)) return false

    return true
  }
  public async abort(code: number): Promise<void> {
    await this.interaction.editReply(`${InteractionObserver.abortReasons.get(code)} (Error code ${code})`)
  }
}

export default InteractionObserver
