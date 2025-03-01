import Log from './log.js'

export const formatSeconds = (seconds: number, s?: boolean, truncate: NumberRange<0, 7> = 7): string => {
  let units: {
    [key: string]: number
  } = {
    'year': 365 * 24 * 60 * 60,
    'month': 30.5 * 24 * 60 * 60,
    'week': 7 * 24 * 60 * 60,
    'day': 24 * 60 * 60,
    'hour': 60 * 60,
    'minute': 60,
    'second': 1,
  }
  let result: Array<string> = []

  for (let [unit, time] of Object.entries(units)) {
    let count = Math.floor(seconds / time)
    if (count > 0) {
      result.push(`${count} ${unit}${s ? 's' : count > 1 ? 's' : ''}`)
      seconds %= time
    }
  }
  result.splice(truncate)
  return result.join(', ') || '0 seconds'
}

export const averageArray = (array: Array<number>): number => array.length ? array.reduce((a: number, b: number) => a + b) / array.length : 0

export const sumArray = (array: Array<number>): number => array.reduce((a: number, b: number) => a + b, 0)

export const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max)

export const dateSuffix = (day: number): string => {
  let last: number = day % 10
  let lastTwo: number = day % 100
  if ([11, 12, 13].includes(lastTwo)) return 'th'
  switch (last) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

export const formatDate = (string: string): string => {
  let date: Date = new Date(string)
  try {
    let months: Array<string> = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    if (!(date instanceof Date && !isNaN(date.getDate()))) throw new Error('Invalid date')
    let day: number = date.getUTCDate()
    let name: string = months[date.getUTCMonth()]
    return `${name} ${day}${dateSuffix(day)}, ${date.getUTCFullYear()}`
  } catch (err) {
    Log.error('Failed to retrieve date', err)
  }
}

export const capitalize = (string: string): string => string.split(' ').map((r: string): string => `${r[0].toUpperCase()}${r.slice(1)}`).join(' ')

export const remove = (array: Array<unknown>, index: number): void => {
  if (index === -1) return

  let last: unknown = array.pop()
  if (index !== array.length)
    array[index] = last
}

export const extractTime = (time: string): number => {
  let total: number = 0
  let regex: RegExp = /(\d+)\s*(seconds?|s|months?|mo|minutes?|m|mins?|min|hours?|h|days?|d|weeks?|w|years?|y)/gi
  let match: RegExpExecArray
  while ((
    match = regex.exec(time)
  ) !== null) {
    let value: number = parseInt(match[1], 10)
    let unit: string = match[2].toLowerCase()

    // i really hate this
    if (/^(seconds?|s)$/i.test(unit)) {
      total += value
    } else if (/^(minutes?|m|mins?|min)$/i.test(unit)) {
      total += value * 60
    } else if (/^(hours?|h)$/i.test(unit)) {
      total += value * 3600
    } else if (/^(days?|d)$/i.test(unit)) {
      total += value * 86400
    } else if (/^(weeks?|w)$/i.test(unit)) {
      total += value * 604800
    } else if (/^(months?|mo)$/i.test(unit)) {
      total += value * 30 * 86400
    } else if (/^(years?|y)$/i.test(unit)) {
      total += value * 365 * 86400
    }
  }

  return total
}
