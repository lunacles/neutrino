import LSH from '../utilities/lsh.js'

const AutoComplete = {
  lsh: new LSH(50),
  fetch(str: string): Array<string> {
    return this.lsh.autocomplete(str)
  },
  add(str: string): void {
    this.lsh.hashData([str])
  }
}

export default AutoComplete
