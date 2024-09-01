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
import { FirebaseDatabase } from './db/firebase/database.js'
import JSONDatabase from './db/json/database.js'
import BinaryHeap from './utilities/heap.js'
import AutoComplete from './commands/autocomplete.js'
import Database from './db/database.js'

const Bot = class {
  public client: Client
  private rest: REST
  public commands: Collection<any, any>
  private cacheRequests: Map<string, number>
  constructor(client: Client) {
    this.client = client
    this.commands = new Collection()
    this.cacheRequests = new Map<string, number>()
  }
  public async init(): Promise<void> {
    console.log('a')
    // login
    await this.client.login(config.env.BOT_TOKEN)

    this.client.on(Events.ClientReady, async (): Promise<void> => {
      console.log('b')
      if (!this.client || !this.client.user) throw new Error('User not found')
      Log.info(`Client initialized as ${this.client.user.tag}`)

      // compile & test the commands
      Log.info('Compiling commands...')
      await this.compileCommands()

      // get the build info
      Log.info('Getting build information...')
      await Build.load()

      Log.info('Initializing Database...')
      await this.startDatabase()

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
  private async startDatabase() {
    let leaderboard = config.databaseType === 'json' ? JSONDatabase.data.leaderboard : await FirebaseDatabase.fetchLeaderboard()

    // add all the users on the leaderboard to the cache
    Database.discord.leaderboard = new BinaryHeap<string>((a: string, b: string): boolean => {
      // because of the databaseinstance structure the entries we check will always be in the cache
      let adi = Database.discord.users.cache.get(a)?.score ?? 0
      let bdi = Database.discord.users.cache.get(b)?.score ?? 0

      return adi > bdi
    }, 10).build(leaderboard)

    Database.discord.members = new Map(Object.entries(config.databaseType === 'json' ?
      JSONDatabase.data.members :
      await FirebaseDatabase.fetchMembers()
    ))

    const init = setInterval(async () => {
      if (bot) {
        await Promise.all(leaderboard.map(entry => Database.discord.users.fetch(entry)))
        clearInterval(init)
      }
    }, 3e3)

    AutoComplete.lsh.hashData(Array.from(Database.discord.members.keys()))
  }
  private awaitInteractions(): void {
    this.client.on(Events.InteractionCreate, async (interaction: Interaction): Promise<void> => {
      if (!interaction.isChatInputCommand()) return
      let name = interaction.commandName
      const command = this.commands.get(name)

      try {
        //if (interaction.guildId !== '1198061774512078879') {
        //  await interaction.reply('no you cant use this here rn or something idk im making sure it no brakey')
        //  return
        //}
        if (interaction.isAutocomplete()) {
          if (!command) {
            Log.error(`No command matching ${name} was found.`)
            return
          }

          try {
            await command.autocomplete(interaction)
          } catch (err) {
            Log.error('Failed to perform autocomplete: ', err)
          }
        }

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