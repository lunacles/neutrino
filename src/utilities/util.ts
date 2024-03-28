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
