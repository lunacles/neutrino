import {
  CommandInteraction,
  GuildBasedChannel,
  ChannelType,
  Collection,
  PermissionsBitField,
  GuildChannel,
  GuildTextBasedChannel,
  EmbedBuilder,
  ColorResolvable,
  TextChannel,
  Message,
} from 'discord.js'
import {
  ObserverInterface,
  Action,
} from '../types.d.js'
//import Secret from 'utilities/secret.js'
import Colors from 'canvas/palette.js'
import global from 'global.js'
import Icon from 'utilities/icon.js'

const Observer = class<T extends CommandInteraction> implements ObserverInterface {
  public static abortReasons = new Map([
    [0, 'You have insufficient permissions to run this command'],
    [1, 'Command unavailable'],
    [2, 'Invalid channel type'],
    [3, 'Command is not available in this server'],
    [4, 'The selected user cannot be yourself'],
    [5, 'This command can only be used in <#1227836204087640084>'],
    [6, 'Selected channel does not support permission overwrites'],
    [7, 'This command can only be used in <#1244869387991781428>'],
    [8, 'This command can only be used in <#1244869433911152690>'],
  ])
  public readonly interaction: T
  public filter: Collection<string, GuildBasedChannel>
  public constructor(interaction: T) {
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
    await this.interaction.editReply(`${Observer.abortReasons.get(code)} (Error code ${code})`)
  }
  public async panic(error: Error, command: string): Promise<void> {
    /*
    const embed = new EmbedBuilder()
      .setThumbnail(`attachment://${Icon.HazardSign}`)
      .setColor(Colors.error.hex as ColorResolvable)
      .setDescription(`\`${Secret.encrypt(error.stack)}\``)
    */
    let message: Message<boolean> = await this.interaction.editReply({
      content: 'Oopsie! Something went wrong. The bot creator has been notified!',
      //embeds: [embed],
    })

    let errorTrace = await this.interaction.client.channels.fetch(global.errorTraceChannel) as TextChannel
    await errorTrace.send({
      content: `<@${global.ownerId}>`,
      embeds: [new EmbedBuilder()
        .setColor(Colors.error.hex as ColorResolvable)
        .setThumbnail(`attachment://${Icon.HazardSign}`)
        .setDescription([
          `# ${error.name}`,
          `**Server ID**: ${message.guildId}`,
          `**Channel ID**: ${message.channelId}`,
          `**Link**: ${message.url}`,
          `**User**: <@${this.interaction.user.id}> (${this.interaction.user.id})`,
          `**Command**: ${command}`,
          `**Stack Trace**: \`\`\`${error.stack}\`\`\``
        ].join('\n'))
      ]
    })
  }
}

export default Observer
