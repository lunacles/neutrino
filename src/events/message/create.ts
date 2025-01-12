import {
  Message,
  Events,
  AttachmentBuilder,
} from 'discord.js'
import config from '../../config.js'
import nodeUtil from 'node:util'

// It'd be better to not call a function everytime we run react
// although for the sake of keeping things clean we'll do it anyway
const Task = {
  async sendEvalOutput(message: Message, content: string): Promise<void> {
    let attachment = new AttachmentBuilder(Buffer.from(content, 'utf-8'), {
      name: 'output.md'
    })
    await message.reply({ files: [attachment] })
  },
  async eval(bot: BotInterface, message: Message, db: DatabaseInterface): Promise<void> {
    // If we're not the owner then tell them to take a hike
    if (message.author.id !== config.ownerId) {
      message.reply('fuck off')
      return
    }

    try {
      // Cut off the command
      let code = message.content.slice(6).trim()
      // Run the eval
      let evalResult = eval(code)
      if (typeof evalResult !== 'string')
        evalResult = nodeUtil.inspect(evalResult)

      // censor env variables from it if they are present
      for (let value of Object.values(config.env)) {
        let regex = new RegExp(value, 'g')
        evalResult = evalResult.replace(regex, '[REDACTED]')
      }

      await this.sendEvalOutput(message, `# Eval Output\n\`\`\`js\n${evalResult}\n\`\`\``)
    } catch (err) {
      // If we fuck it up tell us lol
      await this.sendEvalOutput(message, `# Eval Error\n\`\`\`js\n${err.message}\n\`\`\``)
    }
  },
  handleActivity(timestamp: number, guildInstance: DatabaseGuildInstance): void {
    // if the last message in the array was from an hour ago then get rid of it
    // this helps offload work from the PriorityQueue
    let last = guildInstance.activity[0]
    if (Date.now() - last > 1e3 * 60 * 60)
      guildInstance.activity.shift()

    // p-p-push it real goood do dodo do do do dododo ooo baby baby - b-baby baby
    guildInstance.activity.push(timestamp)
  }
}

export default {
  id: Events.MessageCreate,
  async react(bot: BotInterface, message: Message, db: DatabaseInterface): Promise<void> {
    // if the user is a bot, ignore them
    if (message.author.bot) return

    // do evals
    if (message.content.startsWith(`${config.prefix}eval`))
      await Task.eval(bot, message, db)

    let guildInstance: DatabaseGuildInstance = await db.discord.guilds.fetch(message.guild)
    // handle guild activity for the priority queue
    Task.handleActivity(message.createdTimestamp, guildInstance)
  }
}
