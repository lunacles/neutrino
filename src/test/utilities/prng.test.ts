import PRNG from '../../utilities/prng'

describe('PRNG', () => {
  it('SFC32', () => {
    let prng = PRNG.sfc32(5435, 5435, 5435, 5435)
    prng()
    prng()

    expect(prng()).toBeCloseTo(0.884324, 6)
    expect(prng()).toBeCloseTo(0.552118, 6)
  })

  it('SplitMix32', () => {
    let prng: () => number = PRNG.splitMix32(5435)

    expect(prng()).toBeCloseTo(0.985016, 4)
    expect(prng()).toBeCloseTo(0.214515, 4)
  })

  it('Simple', () => {
    let prng: () => number = PRNG.simple(5435)

    expect(prng()).toBeCloseTo(0.042536, 4)
    expect(prng()).toBeCloseTo(0.907878, 4)
  })
})
