import * as util from './util.js'

interface LogInterface {
  startTime: number
  uptime: string
  time: string
  error(reason: string, err?: Error | object): void
  warn(reason: string): void
  info(info: string): void
}

const Log: LogInterface = {
  startTime: Date.now(),
  get uptime(): string {
    return util.formatSeconds(process.uptime())
  },
  get time(): string {
    return `[${new Date().toISOString()}] [${((Date.now() - Log.startTime) * 0.001).toFixed(3)}]`
  },
  error(reason: string, err?: Error | object): void {
    console.error(Log.time, 'ERROR:', reason, err)
  },
  warn(reason: string): void {
    console.warn(Log.time, 'WARN:', reason)
  },
  info(info: string): void {
    console.info(Log.time, 'INFO:', info)
  },
}

export default Log
