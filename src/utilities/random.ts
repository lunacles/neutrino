const Random = class RandomInterface {
  public prng: Function
  public result: number
  constructor(prng: Function = () => Math.random()) {
    this.prng = prng
    this.result = 0
  }
  public asInteger(): number {
    return this.result | 0
  }
  public asFloat(): number {
    return this.result
  }
  public fromRange(min: number, max: number): this {
    this.result = this.prng() * (max - min) + min
    return this
  }
  public float(n: number = 1.0): number {
    return n * this.prng()
  }
  public integer(i: number = 1): number {
    return (this.prng() * Math.floor(i)) | 0
  }
  public chance(probability: number = 1): boolean {
    return this.prng() < probability
  }
  public fromArray(array: Array<any> = []): any {
    return array[this.integer(array.length)]
  }
  public fromObject(object: object = {}): number {
    let values = Object.values(object)
    return this.fromArray(values)
  }
  public index(probabilities: Array<any> = []): number {
    let totalProbability = probabilities.reduce((a, b) => a + b, 0)
    let chance = this.float(totalProbability)
    for (let [i, probability] of probabilities.entries()) {
      if (chance < probability) return i
      chance -= probability
    }
  }
  public shuffleArray(array: Array<any>): Array<any> {
    return array.slice().sort(() => 0.5 - this.float())
  }
}

export default Random
