import BinaryHeap from '../../utilities/heap'

describe('Binary Heap', (): void => {
  const Heap = new BinaryHeap<number>((a: number, b: number) => a < b, 10)
  let data: Array<number> = [ 1, 5, 7, 2, 3, 8, 4, 6, 9, 0 ]

  it('Builds a binary heap from provided data', (): void => {
    Heap.build(data)
    expect(Heap.heap).toStrictEqual([ 0, 1, 4, 2, 3, 8, 7, 6, 9, 5 ])
  })

  it('Checks if a value belongs in the heap', (): void => {
    expect(Heap.belongs(11)).toBeFalsy()
    expect(Heap.belongs(-1)).toBeTruthy()
  })

  it('Removes the last element from the heap and returns it', (): void => {
    Heap.pop()
    expect(Heap.pop()).toBe(9)
  })

  it('Pushes an element to the heap and returns the heap length', (): void => {
    expect(Heap.push(-1)).toBe(9)
  })

  it('Inserts an element into the heap and rebuilds it', (): void => {
    Heap.insert(-2)
    expect(Heap.heap).toStrictEqual([ -2, 0, 4, 2, 1, 8, 7, 6, -1, 3 ])
  })

  it('Misc', (): void => {
    expect(Heap.size).toBe(10)
    expect(Heap.first).toBe(-2)
    expect(Heap.last).toBe(3)
  })
})



