export interface PRNGInterface {
  MathRandom: () => number
  sfc32: (a: number, b: number, c: number, d: number) => number
  splitMix32: (a: number) => number
  simple: (a: number) => Function
}

export const PRNG: PRNGInterface = {
  // Why not include this lol
  MathRandom: Math.random,
  // Small Fast Counter 32-Bit - https://pracrand.sourceforge.net/
  sfc32: (a: number = 1, b: number = 1, c: number = 1, d: number = 1): number => {
    a >>>= 0
    b >>>= 0
    c >>>= 0
    d >>>= 0
    let t = (a + b) | 0
    a = b ^ b >>> 9
    b = c + (c << 3) | 0
    c = (c << 21 | c >>> 11)
    d = d + 1 | 0
    t = t + d | 0
    c = c + t | 0
    return (t >>> 0) / 4294967296
  },
  // SplitMix32 - https://en.wikipedia.org/wiki/Hamming_weight
  splitMix32: (a: number = 1): number => {
    a |= 0
    a = a + 0x9e3779b9 | 0
    let t = a ^ a >>> 16
    t = Math.imul(t, 0x21f0aaad)
    t = t ^ t >>> 15
    t = Math.imul(t, 0x735a2d97)
    return ((t = t ^ t >>> 15) >>> 0) / 4294967296
  },
  // Very simple, yet uniform
  simple(a: number = 1): Function {
    a = a % 2147483647
    if (a <= 0)
      a += 2147483646

    return (): number => {
      a = a * 16807 % 2147483647
      return (a - 1) / 2147483646
    }
  }
}
