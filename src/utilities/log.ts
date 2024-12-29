import * as util from './util.js'
import chalk from 'chalk'
import supportsColor, { ColorInfo } from 'supports-color'

const Log: LogInterface = {
  startTime: Date.now(),
  get colorSupport(): ColorInfo {
    return supportsColor.stdout
  },
  get uptime(): string {
    return util.formatSeconds(Math.floor(process.uptime()), true)
  },
  get time(): string {
    return this.colorSupport ?
      chalk.gray(`[${new Date().toISOString()}]`) + chalk.white(`[${((Date.now() - Log.startTime) * 0.001).toFixed(3)}]`) :
      `[${new Date().toISOString()}] [${((Date.now() - Log.startTime) * 0.001).toFixed(3)}]`
  },
  error(reason: string, err?: Error | object): void {
    this.colorSupport ?
      console.error(Log.time, chalk.bold.red('ERROR:'), chalk.italic.white(reason), '\n' + err) :
      console.error(Log.time, 'ERROR:', reason, '\n' + err)
  },
  warn(reason: string): void {
    this.colorSupport ?
      console.warn(Log.time, chalk.bold.yellow('WARN:'), chalk.italic.white(reason)) :
      console.warn(Log.time, 'WARN:', reason)
  },
  info(info: string): void {
    this.colorSupport ?
      console.info(Log.time, chalk.bold.green('INFO:'), chalk.italic.white(info)) :
      console.info(Log.time, 'INFO:', info)
  },
  db(info: string): void {
    this.colorSupport ?
      console.info(Log.time, chalk.bold.blue('DB:'), chalk.italic.white(info)) :
      console.info(Log.time, 'DATABASE:', info)
  }
}

export default Log
