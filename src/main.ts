import dotenv from 'dotenv'
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Collection,
  Events,
  Interaction,
  Partials,
  User,
} from 'discord.js'
import Log from './utilities/log.js'
import {
  Commands,
} from './commands.js'
import MessageCreate from './observer/message/messageCreate.js'
import {
  Database,
  db,
} from './firebase/database.js'
import {
  DocumentReference,
  DocumentData,
} from 'firebase-admin/firestore'
import UserData from './firebase/userdoc.js'

dotenv.config()

const Bot = class {
  public client: Client
  private rest: REST
  public commands: Collection<any, any>
  constructor(client: Client) {
    this.client = client
    this.commands = new Collection()
  }
  private async loadDatabase(): Promise<void> {
    let documents: Array<DocumentReference<DocumentData, DocumentData>> = await db.collection('users').listDocuments()
    for (let document of documents) {
      let data: DocumentData = (await document.get()).data()
      if (!data || data?.placeholder) continue
      let author: User = await bot.client.users.fetch(data?.id, { force: true })
      Database.users.set(data?.id, new UserData(author))
    }
  }
  public async init(): Promise<void> {
    // login
    await this.client.login(process.env.BOT_TOKEN)
    // import the database
    await this.loadDatabase()

    this.client.on(Events.ClientReady, async (): Promise<void> => {
      if (!this.client || !this.client.user) throw new Error('User not found')
      Log.info(`Client initialized as ${this.client.user.tag}`)

      // compile & test the commands
      Log.info('Compiling commands...')
      await this.compileCommands()

      Log.info(`${this.client.user.tag} is now accepting interactions`)
      this.awaitInteractions()
    })
  }
  private async compileCommands(): Promise<void> {
    const commands = await Commands.compile()

    this.rest = new REST({
      version: '10'
    }).setToken(this.client.token)

    await this.rest.put(Routes.applicationCommands(process.env.BOT_CLIENT_ID), {
      body: commands,
    })
  }
  private awaitInteractions(): void {
    this.client.on(Events.InteractionCreate, async (interaction: Interaction): Promise<void> => {
      if (!interaction.isChatInputCommand()) return

      const command = this.commands.get(interaction.commandName)

      try {
        await command.execute(interaction)
      } catch (err) {
        Log.error(`Command execution ${interaction.commandName} failed`, err)
      }
    })
  }
  public events(): void {
    this.client.on(Events.MessageCreate as never, async (message) => {
      try {
        await MessageCreate.react(this.client, message)
      } catch (err) {
        Log.error(`Client event ${Events.MessageCreate} failed`, err)
      }
    })
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
bot.init()
bot.events()
export default bot
