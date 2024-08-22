import {
  Message,
  Events,
  AttachmentBuilder,
} from 'discord.js'
import global from 'global'
import nodeUtil from 'node:util'

const MessageCreate: Observer = {
  id: Events.MessageCreate,
  active: false,
  async react(bot: any, message: Message, db): Promise<void> {
    // if the user is a bot, ignore them
    if (message.author.bot) return

    if (message.content.startsWith(`${global.prefix}eval`)) {
      if (message.author.id !== global.ownerId) {
        message.reply('fuck off')
        return
      }

      try {
        let code = message.content.slice(6).trim()
        let evalResult = eval(code)
        if (typeof evalResult !== 'string')
          evalResult = nodeUtil.inspect(evalResult)

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
