import { Ease } from '../types/enum.js'

const Easing = {
  linear(x: number): number {
    return x
  },
  quadIn(x: number): number {
    return x ** 2
  },
  quadOut(x: number): number {
    return x * (2 - x)
  },
  quadInOut(x: number): number {
    return x < 0.5 ? 2 * x ** 2 : -1 + (4 - 2 * x) * x
  },
  cubicIn(x: number): number {
    return x ** 3
  },
  cubicOut(x: number): number {
    return 1 - (1 - x) ** 3
  },
  cubicInOut(x: number): number {
    return x < 0.5 ? 4 * x ** 3 : (x - 1) * (2 * x - 2) * (2 * x - 2) + 1
  },
  quartIn(x: number): number {
    return x ** 4
  },
  quartOut(x: number): number {
    return 1 - (1 - x) ** 4
  },
  quartInOut(x: number): number {
    return x < 0.5 ? 8 * x ** 4 : 1 - (-2 * x + 2) ** 4 / 2
  },
}

const Interpolator = class {
  public static create({ frameDuration = 1, type = Ease.Linear  }: Interpolation) {
    return new Interpolator(type, frameDuration)
  }
  type: Enumeral<Ease>
  frameDuration: number
  display: number
  constructor(type: Enumeral<Ease>, frameDuration: number = 1) {
    this.frameDuration = frameDuration
    this.type = type
  }
  public get(frame: number): NumberRange<0, 1> {
    let curve: number = Easing[this.type](frame / this.frameDuration)

    if (frame >= this.frameDuration) {
      return 1
    } else {
      return curve
    }
  }
}

export default Interpolator
