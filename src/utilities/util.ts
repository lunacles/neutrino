import {
  Timestamp
} from 'firebase-admin/firestore'

export const structureData = (data: any): any => {
  // direct return for non-object/non-array data types
  if (typeof data !== 'object' || data === null) return data
  // special handling for Timestamps
  if (data instanceof Timestamp) return data
  // handling for Arrays
  if (Array.isArray(data)) return data.map(item => structureData(item))
  // handling for Maps and Objects
  let entries: Array<[string, unknown]> = data instanceof Map ? Array.from(data.entries()) : Object.entries(data)
  let result: object = Object.fromEntries(entries.map(([key, value]) => [key, structureData(value)]))
  return result
}

export const formatSeconds = (seconds: number, s: boolean = false): string => {
  let minutes: number = Math.floor(seconds / 60)
  let remainder: number = seconds % 60
  let result: string = ''

  if (minutes > 0)
    result += `${minutes} minute${s ? minutes > 1 ? 's' : '' : ''}`

  if (remainder > 0) {
    if (result.length > 0)
      result += ', '

    result += `${remainder} second${s ? remainder > 1 ? 's' : '' : ''}`
  }

  return result || '0 seconds'
}
