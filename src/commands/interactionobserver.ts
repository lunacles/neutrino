import {
  CommandInteraction,
  GuildBasedChannel,
  ChannelType,
  Collection,
  PermissionsBitField,
  GuildChannel,
  GuildTextBasedChannel,
  GuildMember,
  User,
} from 'discord.js'
//import Secret from 'utilities/secret.js'
import config from '../config.js'
import Database from '../db/database.js'

const Observer = class implements ObserverInterface {
  public static readonly cooldowns = new Map<string, CommandCooldownInterface>()

  public readonly interaction: CommandInteraction
  public filter: Collection<string, GuildBasedChannel>
  private guildData: DatabaseGuildInstance
  public constructor(interaction: CommandInteraction) {
    this.interaction = interaction
    this.guildData = null

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
  public async defer(ephemeral?: boolean): Promise<this> {
    await this.interaction.deferReply({ ephemeral: ephemeral })
    return this
  }
  public async killInteraction(reason: string): Promise<void> {
    let reject: Function
    if (this.interaction.deferred) {
      await this.interaction.deleteReply()
      reject = this.interaction.followUp
    } else {
      reject = this.interaction.reply
    }
    await reject({
      content: reason,
      ephemeral: true,
      components: [],
    })
  }
  private createUserCooldown(): void {
    Observer.cooldowns.set(this.interaction.user.id, {
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
    if (!Observer.cooldowns.has(this.interaction.user.id))
      this.createUserCooldown()

    return Math.floor((Date.now() - Observer.cooldowns.get(this.interaction.user.id)[type]) / 1e3) < config.cooldown[type] && this.interaction.user.id !== config.ownerId
  }
  public getCooldown(type: Cooldowns): number {
    return config.cooldown[type] - Math.floor((Date.now() - Observer.cooldowns.get(this.interaction.user.id)[type]) / 1e3)
  }
  public resetCooldown(type: Cooldowns): void {
    if (!Observer.cooldowns.has(this.interaction.user.id))
      this.createUserCooldown()

    Observer.cooldowns.set(this.interaction.user.id, {
      ...Observer.cooldowns.get(this.interaction.user.id),
      [type]: Date.now()
    })
  }
  public async getGuildData(): Promise<DatabaseGuildInstance> {
    this.guildData = await Database.discord.guilds.fetch(this.interaction.guild)
    return this.guildData
  }
  public async getGuildUserData(user?: string | GuildMember): Promise<DatabaseGuildMemberInstance> {
    if (!this.guildData)
      await this.getGuildData()

    return await this.guildData.fetchMember(user ?? this.interaction.member)
  }
  public async getUserData(user?: string | User): Promise<DatabaseUserInstance> {
    return await Database.discord.users.fetch(user ?? this.interaction.user)
  }
}

export default Observer
