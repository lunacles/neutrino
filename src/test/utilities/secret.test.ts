import Secret from '../../utilities/secret'

describe('Secret', () => {
  it('Cyrb53', () => {
    expect(Secret.cyrb53('test seed')).toBe(7658011905481766)
  })
})
