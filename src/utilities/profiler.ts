import * as util from './util.js'
import Log from './log.js'

interface ProfilerInterface {
  data: Array<any>
  time: number
  totalSum: number

  set(): void
  mark(): void
  getAverage(): number
  sum(): number
}

interface Profilers {
  presence: ProfilerInterface
  username: ProfilerInterface
  displayName: ProfilerInterface
  globalAvatar: ProfilerInterface
  globalBanner: ProfilerInterface
  message: ProfilerInterface
  guildAvatar: ProfilerInterface
  guildBanner: ProfilerInterface
  fetchGuildAuthor: ProfilerInterface
  accountCreation: ProfilerInterface
  batchWrite: ProfilerInterface
  main: ProfilerInterface
  logs: ProfilerInterface
  guildLogs: ProfilerInterface
  fetch: ProfilerInterface
  saveFile: ProfilerInterface
  getURL: ProfilerInterface
  all: ProfilerInterface
}

const Profiler = class ProfilerInterface {
  static logs: Profilers
  static mspt: number = 0
  static init(): void {
    Profiler.logs = {
      presence: new Profiler(),
      username: new Profiler(),
      displayName: new Profiler(),
      globalAvatar: new Profiler(),
      globalBanner: new Profiler(),
      message: new Profiler(),
      guildAvatar: new Profiler(),
      guildBanner: new Profiler(),
      fetchGuildAuthor: new Profiler(),
      accountCreation: new Profiler(),
      batchWrite: new Profiler(),
      main: new Profiler(),
      logs: new Profiler(),
      guildLogs: new Profiler(),
      fetch: new Profiler(),
      saveFile: new Profiler(),
      getURL: new Profiler(),
      all: new Profiler(),
    }
  }
  static checkSpeed(): void {
    Profiler.mspt = Profiler.logs.accountCreation.getAverage()

    let timeTrace: object = {}
    for (let [entry, profile] of Object.entries(Profiler.logs))
      timeTrace[entry] = profile.sum()

    if (Profiler.mspt > 1e3) {
      Log.error(`Client overloaded with ${Profiler.mspt.toFixed(1)}mspt! Final time trace: `, timeTrace)
      //throw new Error('Client overloaded')
    } else if (Profiler.mspt > 10) {
      Log.warn(`Client overloading with ${Profiler.mspt.toFixed(1)}mspt. Time trace: `)
    }
  }
  public data: Array<any>
  public time: number
  public totalSum: number
  constructor() {
    this.data = []
    this.time = Date.now()
    this.totalSum = 0
  }
  public set(): void {
    this.time = Date.now()
  }
  public mark() {
    let duration = Date.now() - this.time
    this.totalSum += duration
    this.data.push(duration)
  }
  public getAverage(): number {
    return util.averageArray(this.data)
  }
  public sum(): number {
    let o = util.sumArray(this.data)
    this.data = []
    return o
  }
}

Profiler.init()

export default Profiler
