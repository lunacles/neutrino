import { HashInterface } from '../types.d.js'

const Hash: HashInterface = {
  // 53-bit string hash - https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
  cyrb53(str: string = '', seed: number = 0): number {
    let h1 = 0xdeadbeef ^ seed
    let h2 = 0x41c6ce57 ^ seed
    let ch: number
    for (let i = 0; i < str.length; i++) {
      ch = str.charCodeAt(i)
      h1 = Math.imul(h1 ^ ch, 0x85ebca77)
      h2 = Math.imul(h2 ^ ch, 0xc2b2ae3d)
    }
    h1 ^= Math.imul(h1 ^ (h2 >>> 15), 0x735a2d97)
    h2 ^= Math.imul(h2 ^ (h1 >>> 15), 0xcaf649a9)
    h1 ^= h2 >>> 16
    h2 ^= h1 >>> 16
    return 2097152 * (h2 >>> 0) + (h1 >>> 11)
  }
}

export default Hash
