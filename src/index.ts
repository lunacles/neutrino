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
} from 'discord.js'
import Log from './utilities/log.js'
import {
  Commands,
} from './commands.js'
import Build from './utilities/repo.js'
import EventObservers from './observer/observers.js'
import Database from './db/database.js'

const Bot = class {
  public client: Client
  private rest: REST
  public commands: Collection<string, CommandInterface>
  private cacheRequests: Map<string, number>
  constructor(client: Client) {
    this.client = client
    this.commands = new Collection()
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
  private awaitInteractions(): void {
    this.client.on(Events.InteractionCreate, async (interaction: Interaction): Promise<void> => {
      if (!interaction.isChatInputCommand()) return
      let name = interaction.commandName
      const command: CommandInterface = this.commands.get(name)
      const guildData: DatabaseGuildInstance = await Database.discord.guilds.fetch(interaction.guildId)

      // ignore the interaction if it's part of the ignored channels
      console.log(guildData.ignoredChannels)
      if (guildData.ignoredChannels.has(interaction.channelId)) return

      try {
        await command.execute(interaction)
      } catch (err) {
        Log.error(`Command execution ${interaction.commandName} failed`, err)
      }
    })
  }
  public events(): void {
    for (let event of Object.values(EventObservers)) {
      this.client.on(event.id as never, async (data) => {
        try {
          await event.react(this, data, Database)
        } catch (err) {
          Log.error(`Client event ${event.id} failed`, err)
        }
      })
    }
  }
  async fetchGuild(id: string): Promise<Guild> {
    return this.client.guilds.cache.get(id) ?? await this.client.guilds.fetch(id)
  }
  async fetchUser(id: string): Promise<User> {
    let reqs = this.cacheRequests.get(id) ?? 0
    const user = await bot.client.users.fetch(id, { force: reqs <= 0 })
    this.cacheRequests.set(id, (reqs + 1) % 6) // reset to 0 after 5 requests

    return user
  }
  async fetchGuildMember(id: string, guild: Guild): Promise<GuildMember> {
    let member = guild.members.cache.get(id)
    return member ?? await guild.members.fetch(id)
  }
}
const bot = new Bot(new Client({
  intents: [
    GatewayIntentBits.AutoModerationConfiguration,
    GatewayIntentBits.AutoModerationExecution,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.Guilds,
  ],
  partials: [
    Partials.GuildScheduledEvent,
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
