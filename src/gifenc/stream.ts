// Modified from: https://github.com/mattdesl/gifenc/tree/master
// plan on improving later.
const GifStream = class {
  cursor: number
  contents: Uint8Array
  constructor(initialCapacity: number = 256) {
    this.cursor = 0
    this.contents = new Uint8Array(initialCapacity)
  }
  get buffer(): ArrayBufferLike {
    return this.contents.buffer
  }
  reset(): void {
    this.cursor = 0
  }
  bytesView(): Uint8Array {
    return this.contents.subarray(0, this.cursor)
  }
  bytes(): Uint8Array {
    return this.contents.slice(0, this.cursor)
  }
  writeByte(byte: number): void {
    this.expand(this.cursor + 1)
    this.contents[this.cursor] = byte
    this.cursor++
  }
  writeBytes(data: Array<number>, offset: number = 0, byteLength: number = data.length): void {
    this.expand(this.cursor + byteLength)
    for (let i = 0; i < byteLength; i++) {
      this.contents[this.cursor++] = data[i + offset]
    }
  }
  writeBytesView(data: Uint8Array, offset: number = 0, byteLength: number = data.byteLength): void {
    this.expand(this.cursor + byteLength)
    this.contents.set(data.subarray(offset, offset + byteLength), this.cursor)
    this.cursor += byteLength
  }
  expand(newCapacity: number): void {
    let prevCapacity: number = this.contents.length
    if (prevCapacity >= newCapacity) return

    let capacityDoublingMax: number = 1024 ** 2
    newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < capacityDoublingMax ? 2.0 : 1.125)) >>> 0)
    if (prevCapacity != 0)
      newCapacity = Math.max(newCapacity, 256)

    let oldContents: Uint8Array = this.contents
    this.contents = new Uint8Array(newCapacity)
    if (this.cursor > 0)
      this.contents.set(oldContents.subarray(0, this.cursor), 0)
  }
}

export default GifStream
