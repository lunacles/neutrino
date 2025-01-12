// magic code dont touch..
let config = (await import('./config.js')).default
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Collection,
  Events,
  Interaction,
  Partials,
  Guild,
  User,
  GuildMember,
  ChatInputCommandInteraction,
  CacheType,
  TextChannel,
  EmbedBuilder,
  ColorResolvable,
} from 'discord.js'
import Log from './utilities/log.js'
import {
  Commands,
} from './commands.js'
import Build from './utilities/repo.js'
import EventObservers from './events/observers.js'
import Database from './db/database.js'
import Icon from './utilities/icon.js'
import Colors from './canvas/palette.js'

const Bot = class {
  public client: Client
  private rest: REST
  public commands: Collection<string, CommandInterface>
  private cacheRequests: Map<string, number>
  constructor(client: Client) {
    this.client = client
    this.commands = new Collection<string, CommandInterface>()
    this.cacheRequests = new Map<string, number>()
  }
  public async init(): Promise<void> {
    // login
    await this.client.login(config.env.BOT_TOKEN)

    this.client.on(Events.ClientReady, async (): Promise<void> => {
      if (!this.client || !this.client.user) throw new Error('User not found')
      Log.info(`Client initialized as ${this.client.user.tag}`)

      // compile & test the commands
      Log.info('Compiling commands...')
      await this.compileCommands()

      // get the build info
      Log.info('Getting build information...')
      await Build.load()

      // await interactions
      Log.info(`${this.client.user.tag} is now accepting interactions`)
      this.awaitInteractions()

      this.events()
    })
  }
  private async compileCommands(): Promise<void> {
    const commands = await Commands.compile()

    this.rest = new REST({
      version: '10'
    }).setToken(this.client.token)

    await this.rest.put(Routes.applicationCommands(config.env.BOT_CLIENT_ID), {
      body: commands,
    })
  }
  private async handleError(interaction: ChatInputCommandInteraction<CacheType>, error: Error) {
    let message: InteractionResponse<boolean> = await interaction.reply({
      content: 'Oopsie! Something went wrong. The bot creator has been notified!',
      components: [],
      flags: MessageFlags.Ephemeral,
    })

    let errorTrace = await interaction.client.channels.fetch(config.errorTraceChannel) as TextChannel
    await errorTrace.send({
      content: `<@${config.ownerId}>`,
      embeds: [new EmbedBuilder()
        .setColor(Colors.error.hex as ColorResolvable)
        .setThumbnail(`attachment://${Icon.HazardSign}`)
        .setDescription([
          `# ${error.name}`,
          `**Server ID**: ${interaction.guildId}`,
          `**Channel ID**: ${interaction.channelId}`,
          `**Link**: ${(await interaction.channel.messages.fetch({ limit: 1 })).first().url}`,
          `**User**: <@${interaction.user.id}> (${interaction.user.id})`,
          `**Command**: ${interaction.commandName}`,
          `**Stack Trace**: \`\`\`${error.stack}\`\`\``
        ].join('\n'))
      ]
    })
  }
  private awaitInteractions(): void {
    this.client.on(Events.InteractionCreate, async (interaction: Interaction): Promise<void> => {
      if (!interaction.isChatInputCommand()) return
      let name = interaction.commandName
      const command: CommandInterface = this.commands.get(name)
      const guildData: DatabaseGuildInstance = await Database.discord.guilds.fetch(interaction.guildId)

      // ignore the interaction if it's part of the ignored channels
      if (guildData.ignoredChannels.has(interaction.channelId)) return

      try {
        await command.execute(interaction)
      } catch (err) {
        Log.error(`Command execution ${interaction.commandName} failed`, err)
        await this.handleError(interaction, err)
        Log.error(`Command execution ${interaction.commandName} failed`,)
      }
    })
  }
  private events(): void {
    for (let event of Object.values(EventObservers)) {
      this.client.on(event.id as never, async (data) => {
        try {
          // pass the database in through the react function
          // made it do this like months ago but idr why
          // TODO: see if I can import instead
          await event.react(this, data, Database)
        } catch (err) {
          Log.error(`Client event ${event.id} failed`, err)
        }
      })
    }
  }
  public async fetchGuild(id: string): Promise<Guild> {
    return this.client.guilds.cache.get(id) ?? await this.client.guilds.fetch(id)
  }
  // TODO: uhhhh is this even necessary
  public async fetchUser(id: string): Promise<User> {
    let reqs = this.cacheRequests.get(id) ?? 0
    const user = await this.client.users.fetch(id, { force: reqs <= 0 })
    this.cacheRequests.set(id, (reqs + 1) % 6) // reset to 0 after 5 requests
    return user
  }
  public async fetchGuildMember(id: string, guild: Guild): Promise<GuildMember> {
    return guild.members.cache.get(id) ?? await guild.members.fetch(id)
  }
}
const bot = new Bot(new Client({
  intents: [
    //GatewayIntentBits.AutoModerationConfiguration,
    //GatewayIntentBits.AutoModerationExecution,
    //GatewayIntentBits.GuildEmojisAndStickers,
    //GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.GuildMessageReactions,
    //GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.GuildMessageTyping,
    //GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildPresences,
    //GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    //GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.Guilds,
  ],
  partials: [
    //Partials.GuildScheduledEvent,
    Partials.ThreadMember,
    Partials.GuildMember,
    Partials.Reaction,
    Partials.Channel,
    Partials.Message,
    Partials.User,
  ],
  allowedMentions: {
    parse: ['everyone', 'roles', 'users'],
  },
}))
await bot.init()


export default bot
