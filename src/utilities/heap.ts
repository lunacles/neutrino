import Log from './log.js'

const BinaryHeap = class<T> implements BinaryHeapInterface<T> {
  private maxSize: number
  public heap: Array<T>
  private condition: (aIndex: T, bIndex: T) => boolean
  private indexMap: Map<T, number>
  constructor(condition: (aIndex: T, bIndex: T) => boolean, size?: number) {
    this.maxSize = size as number
    this.heap = []
    this.condition = condition
    this.indexMap = new Map()
  }
  get size(): number {
    return this.heap.length
  }
  set first(value: T) {
    if (!this.heap[0]) return
    this.heap[0] = value
  }
  get first(): T {
    return this.size === 0 ? null : this.heap[0]
  }
  get last(): T {
    return this.size === 0 ? null : this.heap[this.heap.length - 1]
  }
  public pop(): T {
    let max = this.first
    let last = this.heap.pop()
    if (this.size > 0) {
      this.first = last
      this.down(0)
    }
    return max
  }
  public push(value: T): number {
    return this.heap.push(value)
  }
  private childIndices(index: number): Pair<number> {
    return [index * 2 + 1, index * 2 + 2]
  }
  private parentIndex(index: number): number {
    return index <= 0 ? -1 : (index - 1) >> 1
  }
  public insert(value: T): void {
    if (this.size < this.maxSize) {
      this.push(value)
      this.indexMap.set(value, this.size - 1)
      this.up(this.size - 1)
    } else if (this.size > 0 && this.condition(value, this.first)) {
      this.indexMap.delete(this.first)
      this.first = value
      this.indexMap.set(value, 0)
      this.down(0)
    }
  }
  private up(index: number): void {
    let parentIndex = this.parentIndex(index)
    while (index > 0 && this.condition(this.heap[index], this.heap[parentIndex])) {
      this.swap(index, parentIndex)
      index = parentIndex
      parentIndex = this.parentIndex(index)
    }
  }
  private down(index: number): void {
    let [left, right] = this.childIndices(index)
    let largest: number = index

    if (left < this.size && this.condition(this.heap[left], this.heap[largest]))
      largest = left

    if (right < this.size && this.condition(this.heap[right], this.heap[largest]))
      largest = right

    if (largest !== index) {
      this.swap(index, largest)
      this.down(largest)
    }
  }
  private swap(aIndex: number, bIndex: number): void {
    if (aIndex < 0 || bIndex < 0 && aIndex >= this.size || bIndex >= this.size)
      return Log.warn(`Could not swap heap (${this.size}) indices ${aIndex} and ${bIndex}`)

    let tmp: T = this.heap[aIndex]
    this.heap[aIndex] = this.heap[bIndex]
    this.heap[bIndex] = tmp

    this.indexMap.set(this.heap[aIndex], aIndex)
    this.indexMap.set(this.heap[bIndex], bIndex)
  }
  public updateValue(oldValue: T, newValue: T): void {
    let index = this.indexMap.get(oldValue)
    if (index == null) return

    this.indexMap.delete(oldValue)
    this.indexMap.set(newValue, index)
    this.heap[index] = newValue

    if (this.condition(newValue, oldValue)) {
      this.up(index)
    } else {
      this.down(index)
    }
  }
  public build(data: Array<T>): this {
    this.heap = data.slice(0, this.maxSize)

    for (let [index, value] of this.heap.entries())
      this.indexMap.set(value, index)

    for (let i = this.size >> 1 - 1; i >= 0; i--)
      this.down(i)

    for (let i = this.maxSize; i < data.length; i++)
      this.insert(data[i])

    return this
  }
  // use sparingly to avoid excessive resource consumption
  public refresh(): Array<T> {
    // rebuild the heap to restore the heap property
    for (let i = this.size >> 1 - 1; i >= 0; i--)
      this.down(i)

    // update the indexMap
    this.indexMap.clear()
    for (let [index, value] of this.heap.entries())
      this.indexMap.set(value, index)

    return this.heap
  }
  public belongs(value: T): boolean {
    if (this.size < this.maxSize)
      // the heap is not full, so the value belongs.
      return true

    return this.condition(value, this.first)
  }
}

export default BinaryHeap
