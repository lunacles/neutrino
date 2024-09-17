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
//import Secret from 'utilities/secret.js'
import Colors from '../canvas/palette.js'
import config from '../config.js'
import Icon from '../utilities/icon.js'
import { Abort } from '../types/enum.js'

const Observer = class implements ObserverInterface {
  public readonly interaction: CommandInteraction
  public filter: Collection<string, GuildBasedChannel>
  public constructor(interaction: CommandInteraction) {
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
  public componentsFilter(components: Array<string>): (component: Action) => Promise<boolean> {
    return async (component: Action): Promise<boolean> => {
      await component.deferUpdate()
      return components.includes(component.customId) && component.user.id === this.interaction.user.id
    }
  }
  public checkPermissions(permissions: Array<bigint>, channel: GuildChannel | GuildTextBasedChannel): boolean {
    const memberPermissions: Readonly<PermissionsBitField> = channel.permissionsFor(this.interaction.member.user.id)
    if (!memberPermissions) return false
    for (let permission of permissions)
      if (!memberPermissions.has(permission)) return false

    return true
  }
  public async abort(info: typeof Abort[keyof typeof Abort]): Promise<void> {
    await this.interaction.editReply(`${info} (Error code ${Object.keys(Abort).find(key => Abort[key] === info)})`)
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
      components: [],
      //embeds: [embed],
    })

    let errorTrace = await this.interaction.client.channels.fetch(config.errorTraceChannel) as TextChannel
    await errorTrace.send({
      content: `<@${config.ownerId}>`,
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
  public async defer(ephemeral?: boolean): Promise<this> {
    await this.interaction.deferReply({ ephemeral: ephemeral })
    return this
  }
  public async fetchAbort(): Promise<void> {
    await this.interaction.deleteReply()
    await this.interaction.followUp({
      ephemeral: true,
      content: 'It seems the bot has not fetched this server\'s data yet (probably due to a recent restart)!\nPlease wait a few seconds for it to fetch it.',
    })
  }
  private createUserCooldown(): void {
    config.cooldowns.set(this.interaction.user.id, {
      score: 0,
      claim: 0,
      steal: 0,
      gamble: 0,
      shield: 0,
      leaderboard: 0,
      blackjack: 0,
    })
  }
  public isOnCooldown(type: Cooldowns): boolean {
    if (!config.cooldowns.has(this.interaction.user.id))
      this.createUserCooldown()

    return Math.floor((Date.now() - config.cooldowns.get(this.interaction.user.id)[type]) / 1e3) < config.cooldown[type] && this.interaction.user.id !== config.ownerId
  }
  public getCooldown(type: Cooldowns): number {
    return config.cooldown[type] - Math.floor((Date.now() - config.cooldowns.get(this.interaction.user.id)[type]) / 1e3)
  }
  public resetCooldown(type: Cooldowns): void {
    if (!config.cooldowns.has(this.interaction.user.id))
      this.createUserCooldown()

    config.cooldowns.set(this.interaction.user.id, {
      ...config.cooldowns.get(this.interaction.user.id),
      [type]: Date.now()
    })
  }
  public async applyScore(user: DatabaseUserInstance, guild: DatabaseGuildInstance, score: number): Promise<void> {
    await user.setScore(score)

    if (!guild.leaderboard.has(user.id)) {
      if (guild.leaderboard.belongs(user.id)) {
        guild.leaderboard.insert(user.id)
        await guild.refreshLeaderboard()
      }
    } else if (guild.leaderboard.belongs(user.id)) {
      guild.leaderboard.refresh()
      await guild.refreshLeaderboard()
    }
  }
}

export default Observer
