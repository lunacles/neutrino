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

dotenv.config()

const Bot = class extends Client {
  public rest: REST
  public commands: Collection<any, any>
  constructor(options) {
    super(options)
    this.commands = new Collection()
  }
  async init(): Promise<void> {
    try {
      await this.login(process.env.BOT_TOKEN)

      this.on(Events.ClientReady, async (): Promise<void> => {
        if (!this || !this.user) {
          throw new Error('User not found')
        } else {
          Log.info(`Client initialized as ${this.user.tag}`)
        }

        Log.info('Compiling commands...')
        await this.compileCommands()
        Log.info(`${this.user.tag} is now accepting interactions`)
        this.awaitInteractions()
      })
    } catch (err) {
      Log.error('Client failed to initialize', err)
    }
  }
  async compileCommands(): Promise<void> {
    const commands = await Commands.compile()

    this.rest = new REST({
      version: '10'
    }).setToken(this.token)

    await this.rest.put(Routes.applicationCommands(process.env.BOT_CLIENT_ID), {
      body: commands
    })
  }
  async awaitInteractions() {
    this.on(Events.InteractionCreate, async (interaction: Interaction): Promise<void> => {
      if (!interaction.isChatInputCommand()) return

      const command = this.commands.get(interaction.commandName)

      try {
        await command.execute(interaction)
      } catch (err) {
        Log.error(`Command execution ${interaction.commandName} failed`, err)
      }
    })
  }
  events() {
    this.on(Events.MessageCreate as never, async (message) => {
      await MessageCreate.react(this, message)
    })
  }
}

const bot = new Bot({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Channel,
    Partials.GuildMember,
    Partials.GuildScheduledEvent,
    Partials.Message,
    Partials.Reaction,
    Partials.ThreadMember,
    Partials.User,
  ],
  allowedMentions: {
    parse: ["everyone", "roles", "users"],
  },
})
bot.init()
bot.events()
export default bot
