import PRNG from '../../utilities/prng'
import Random from '../../utilities/random'

describe('Random', () => {
  const ran = new Random(PRNG.simple(5435))

  it('Floats', () => {
    expect(ran.float()).toBeCloseTo(0.042536, 4)
    expect(ran.float(10)).toBeCloseTo(9.078785, 4)
    expect(ran.fromRange(2, 10).asFloat()).toBeCloseTo(7.719409, 4)
  })

  it('Integers', () => {
    expect(ran.integer(10)).toBe(7)
    expect(ran.fromRange(2, 10).asInteger()).toBe(6)
  })

  it('Chances', () => {
    expect(ran.chance(0.65)).toBeTruthy()
    expect(ran.index([ 0.1, 0.2, 0.3, 0.4 ])).toBe(3)
  })

  it('Array & Objects', () => {
    let arr: FixedArray<number, 10> = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
    let obj: {
      [key: string]: number
    } = {
      0: 0,
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 6,
      7: 7,
      8: 8,
      9: 9,
    }

    expect(ran.fromArray<number>(arr)).toBe(6)
    expect(ran.fromObject<number>(obj)).toBe(9)
    expect(ran.shuffleArray(arr)).toStrictEqual([8, 5, 6, 0, 1, 9, 2, 7, 3, 4])
  })
})
