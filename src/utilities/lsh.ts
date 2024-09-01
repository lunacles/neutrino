const LSH = class {
  private readonly accuracy: number
  private readonly buckets: {
    [key: number]: Array<string>
  }
  constructor(accuracy: number) {
    this.accuracy = accuracy
    this.buckets = new Array(this.accuracy).fill([])
  }
  private hash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++)
      hash = (hash * 31 + str.charCodeAt(i)) % this.accuracy

    return hash
  }
  public hashData(data: Array<string>): this {
    for (let str of data)
      this.buckets[this.hash(str)].push(str)

    return this
  }
  public autocomplete(pre: string): Array<string> {
    const hash = this.hash(pre)
    const results: Array<{ str: string, dist: number }> = []

    if (this.buckets[hash]) {
      for (const str of this.buckets[hash]) {
        let dist: number = this.levenshteinDistance(pre, str)
        results.push({ str, dist })
      }
      for (let i = 0; i < results.length - 1; i++) {
        let minIndex = i
        for (let j = i + 1; j < results.length; j++) {
          if (results[j].dist < results[minIndex].dist)
            minIndex = j
        }

        if (minIndex !== i) {
          let temp = results[i]
          results[i] = results[minIndex]
          results[minIndex] = temp
        }
      }
    }
    console.log(results)
    return results.slice(0, 10).map(result => result.str)
  }

  // Levenshtein distance function
  private levenshteinDistance(a: string, b: string): number {
    let matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))

    for (let i = 0; i <= a.length; i++)
      matrix[i][0] = i
    for (let j = 0; j <= b.length; j++)
      matrix[0][j] = j

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        let cost = a[i - 1] === b[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        )
      }
    }

    return matrix[a.length][b.length];
  }
  public updateData(oldData: Array<string>, newData: Array<string>): this {
    this.removeData(oldData)
    this.hashData(newData)
    return this
  }
  public removeData(data: Array<string>): this {
    for (let str of data) {
      let hash = this.hash(str)
      if (this.buckets[hash]) {
        this.buckets[hash] = this.buckets[hash].filter((item: string) => item !== str)
        if (this.buckets[hash].length === 0)
          delete this.buckets[hash]
      }
    }
    return this
  }
}

export default LSH
