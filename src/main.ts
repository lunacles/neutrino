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
} from 'discord.js'
import Log from './utilities/log.js'
import {
  Commands,
} from './commands.js'
import MessageCreate from './observer/message/messageCreate.js'
import Build from './utilities/repo.js'
/*import {
  MobileNetModel,
  MobileNetModelInterface
} from './tensorflow/model.js'*/
import { ready, setBackend } from '@tensorflow/tfjs-node'

dotenv.config()
setBackend('tensorflow')
await ready()

const Bot = class {
  public client: Client
  private rest: REST
  public commands: Collection<any, any>
  //public model: MobileNetModelInterface
  constructor(client: Client) {
    this.client = client
    this.commands = new Collection()
    //this.model = null
  }
  public async init(): Promise<void> {
    // login
    await this.client.login(process.env.BOT_TOKEN)

    this.client.on(Events.ClientReady, async (): Promise<void> => {
      if (!this.client || !this.client.user) throw new Error('User not found')
      Log.info(`Client initialized as ${this.client.user.tag}`)

      // compile & test the commands
      Log.info('Compiling commands...')
      await this.compileCommands()

      // get the build info
      Log.info('Getting build information...')
      await Build.load()

      // load the mobilenet model
      //Log.info('Loading mobilenet model...')
      //this.model = await MobileNetModel.load()

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
        await MessageCreate.react(this, message)
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
//bot.events()
export default bot
