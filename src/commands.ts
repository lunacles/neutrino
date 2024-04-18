import fs from 'fs/promises'
import path from 'path'
import Log from './utilities/log.js'
import CommandInterface from './commands/interface.js'
import { fileURLToPath } from 'url'
import bot from './main.js'

export interface CommandsInterface {
  directory: string
  folder: Array<string>

  locate(): Promise<void>
  compile(): Promise<Array<CommandInterface>>
}

export const Commands: CommandsInterface = {
  directory: '',
  folder: [],
  async locate(): Promise<void> {
    this.directory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'commands')
    this.folder = await fs.readdir(this.directory)
  },
  async compile(): Promise<Array<CommandInterface>> {
    const commands: Array<CommandInterface> = []

    await this.locate()
    for (let file of this.folder) {
      if (file === 'interface.ts' || file === 'interactionobserver.ts' || file === 'maze.ts') continue
      try {
        let module = await import(path.join(this.directory, file))

        const command = module.default
        if (!command.test()) throw new Error('Test failed')

        command.data.setName(command.name).setDescription(command.description)
        bot.commands.set(command.data.name, command)
        commands.push(command.data.toJSON())
      } catch (err) {
        Log.error(`Failed to compile command file ${file}`, err)
      }
    }

    return commands
  },
}

export default Commands
