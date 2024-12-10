import * as util from '../../utilities/util'

describe('Utilities', () => {
  let arr: Array<number> = [ 1, 2, 3, 4, 5 ]
  it('Average array', () => {
    expect(util.averageArray(arr)).toBe(3)
  })

  it('Sum array', () => {
    expect(util.sumArray(arr)).toBe(15)
  })

  it('Remove item from array', () => {
    util.remove(arr, 3)
    expect(arr).toStrictEqual([ 1, 2, 3, 5 ])
  })

  it('Capitalize', () => {
    expect(util.capitalize('capitalize')).toBe('Capitalize')
  })

  it('Clamp', () => {
    expect(util.clamp(11, 0, 10)).toBe(10)
    expect(util.clamp(-1, 0, 10)).toBe(0)
    expect(util.clamp(5, 0, 10)).toBe(5)
  })

  it('Date suffix', () => {
    for (let i of [1, 21, 31])
      expect(util.dateSuffix(i)).toBe('st')

    for (let i of [2, 22, 32])
      expect(util.dateSuffix(i)).toBe('nd')

    for (let i of [3, 23, 33])
      expect(util.dateSuffix(i)).toBe('rd')

    for (let i of [
      4, 5, 6, 7, 8, 9, 10,
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      24, 25, 26, 27, 28, 29, 30,
    ]) {
      expect(util.dateSuffix(i)).toBe('th')
    }
  })

  it('Format date', () => {
    expect(util.formatDate('Mon, 21 Oct 2024 17:04:02 -0700')).toBe('October 22nd, 2024')
  })

  it('Format date', () => {
    expect(util.formatSeconds(23443426)).toBe('8 months, 3 weeks, 6 days, 8 hours, 3 minutes, 46 seconds')
    expect(util.formatSeconds(23443426, false, 3)).toBe('8 months, 3 weeks, 6 days')
  })
})
