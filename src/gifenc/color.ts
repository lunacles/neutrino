// Modified from: https://github.com/mattdesl/gifenc/tree/master
// plan on improving later.
import { ColorInterface } from 'types.d.js'

const Color: ColorInterface = {
  // calculate euclidean dist^2
  euclideanDistSqrd(a: Array<number>, b: Array<number>): number {
    let sum: number = 0
    for (let [i, num] of a.entries()) {
      let dx: number = num - b[i]
      sum += dx * dx
    }
    return sum
  },
  // calculate euclidean dist
  euclideanDist(a: Array<number>, b: Array<number>): number {
    return Math.sqrt(this.euclideanDistanceSquared(a, b))
  }
}

export default Color
