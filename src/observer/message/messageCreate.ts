import {
  Message,
  Events,
  AttachmentBuilder,
} from 'discord.js'
import config from '../../config.js'
import nodeUtil from 'node:util'

const MessageCreate: Observer = {
  id: Events.MessageCreate,
  active: false,
  async react(bot: any, message: Message, db): Promise<void> {
    // if the user is a bot, ignore them
    if (message.author.bot) return

    if (message.content.startsWith(`${config.prefix}eval`)) {
      if (message.author.id !== config.ownerId) {
        message.reply('fuck off')
        return
      }

      try {
        let code = message.content.slice(6).trim()
        let evalResult = eval(code)
        if (typeof evalResult !== 'string')
          evalResult = nodeUtil.inspect(evalResult)

        // censor env variables from it if they are present
        for (let value of [
          config.env.FIREBASE_API_KEY,
          config.env.FIREBASE_AUTH_DOMAIN,
          config.env.FIREBASE_PROJECT_ID,
          config.env.FIREBASE_STORAGE_BUCKET,
          config.env.FIREBASE_MESSAGE_SENDER_ID,
          config.env.FIREBASE_APP_ID,
          config.env.FIREBASE_MEASUREMENT_ID,
          config.env.BOT_TOKEN,
          config.env.BOT_CLIENT_ID,
        ]) {
          let regex = new RegExp(value, 'g')
          evalResult = evalResult.replace(regex, '[REDACTED]')
        }

        let mdContent = `# Eval Output\n\`\`\`js\n${evalResult}\n\`\`\``
        const buffer = Buffer.from(mdContent, 'utf-8')

        let attachment = new AttachmentBuilder(buffer, {
          name: 'output.md'
        })
        await message.channel.send({ files: [attachment] })
      } catch (err) {
        let mdErrContent = `# Eval Error\n\`\`\`js\n${err.message}\n\`\`\``
        const errBuffer = Buffer.from(mdErrContent, 'utf-8')

        let attachment = new AttachmentBuilder(errBuffer, {
          name: 'output.md'
        })
        await message.channel.send({ files: [attachment] })
      }
    }
  }
}

export default MessageCreate
