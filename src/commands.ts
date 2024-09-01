import fs from 'fs/promises'
import path from 'path'
import Log from './utilities/log.js'
import { fileURLToPath } from 'url'
import bot from './index.js'

type File = [string, string]
interface CommandsInterface {
  locate(folder: string): Promise<Array<File>>
  compile(): Promise<Array<CommandInterface>>
}

export const Commands: CommandsInterface = {
  async locate(folder: string): Promise<Array<File>> {
    let directory = path.join(path.dirname(fileURLToPath(import.meta.url)), `commands/${folder}`)
    return (await fs.readdir(directory)).map(f => [directory, f])
  },
  async compile(): Promise<Array<CommandInterface>> {
    const commands: Array<CommandInterface> = []

    let files = [
      ...(await this.locate('developer')),
      ...(await this.locate('fun')),
      ...(await this.locate('utility')),
      ...(await this.locate('loot-league')),
      //...(await this.locate('maze')),
    ]
    for (let file of files) {
      if (file === 'interface.ts' || file === 'interactionobserver.ts' || file === 'maze.ts') continue
      try {
        let module = await import(path.join(...file))

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
