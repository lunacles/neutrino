import { loadImage } from 'canvas'
import NodeCanvas from './canvas.js'
import Color from './color.js'
import Colors from './palette.js'
import Interpolator from './interpolator.js'
import { Ease, Suits } from '../types/enum.js'

export const Element = class {
  public readonly canvas: NodeCanvasInterface
  public ctx: any
  public cache: Cached

  public x: number
  public y: number
  public width: number
  public height: number

  public restore: boolean
  constructor() {
    this.canvas = NodeCanvas.activeCanvas.canvas
    this.ctx = NodeCanvas.activeCanvas.ctx

    this.ctx.globalAlpha = 1
    this.cache = {
      type: null,
      run: () => {},
    }

    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
  }
  private resetCache(): void {
    this.cache = {
      type: null,
      run: () => {},
    }
  }
  public setCache({ type = null, run = () => {} }: Cached): void {
    this.cache = {
      type, run,
    }
  }
  public alpha(alpha: number): this {
    if (alpha != null) {
      this.ctx.globalAlpha = alpha
    }

    return this
  }
  public fill(fill: ColorValue, alphaReset: boolean = true): this {
    if (fill instanceof Color)
      fill = fill.hex

    if (fill != null) {
      this.ctx.fillStyle = fill as CanvasColor

      if (this.cache.type) {
        this.cache.run({ fill })
      } else {
        this.ctx.fill()
      }
    }
    if (alphaReset)
      this.ctx.globalAlpha = 1

    this.endTransform()
    this.resetCache()
    return this
  }
  public stroke(stroke: ColorValue, lineWidth: number, alphaReset: boolean = true): this {
    if (stroke instanceof Color)
      stroke = stroke.hex

    if (stroke != null) {
      this.ctx.lineWidth = lineWidth
      this.ctx.strokeStyle = stroke as CanvasColor
      if (this.cache.type) {
        this.cache.run({ stroke, lineWidth })
      } else {
        this.ctx.stroke()
      }
    }
    if (alphaReset)
      this.ctx.globalAlpha = 1

    this.endTransform()
    this.resetCache()
    return this
  }
  public both(fill: ColorValue, stroke: ColorValue, lineWidth: number): this {
    if (fill instanceof Color)
      fill = fill.hex
    if (stroke instanceof Color)
      stroke = stroke.hex

    if (this.cache.type) {
      this.cache.run({ fill, stroke, lineWidth })
    } else {
      this.stroke(stroke, lineWidth, false)
      this.fill(fill, false)
    }
    this.ctx.globalAlpha = 1

    this.resetCache()
    return this
  }
  public lineCap(cap: CanvasLineCap = 'round'): this {
    this.ctx.lineCap = cap
    return this
  }
  public lineJoin(cap: CanvasLineJoin = 'round'): this {
    this.ctx.lineJoin = cap
    return this
  }
  public fillLinearGradient({ x1 = 0, y1 = 0, x2 = 0, y2 = 0, gradient = [] }: LinearGradient): this {
    if (gradient.length > 0) {
      let fill: CanvasGradient = this.ctx.createLinearGradient(x1, y1, x2, y2)
      for (let stop of gradient) {
        if (stop.pos < 0 || stop.pos > 1) throw new Error('Invalid colorstop position.')
        if (stop.color instanceof Color)
          stop.color = stop.color.hex

        fill.addColorStop(stop.pos, stop.color satisfies string)
      }

      this.ctx.fillStyle = fill
      this.ctx.fill()
    }

    return this
  }
  public fillRadialGradient({ x1 = 0, y1 = 0, r1 = 0, x2 = 0, y2 = 0, r2 = 0, gradient = [] }: RadialGradient): this {
    if (gradient.length > 0) {
      let fill: CanvasGradient = this.ctx.createRadialGradient(x1, y1, r1, x2, y2, r2)
      for (let stop of gradient) {
        if (stop.pos < 0 || stop.pos > 1) throw new Error('Invalid colorstop position.')
        if (stop.color instanceof Color)
          stop.color = stop.color.hex

        fill.addColorStop(stop.pos, stop.color satisfies string)
      }

      this.ctx.fillStyle = fill
      this.ctx.fill()
    }

    return this
  }
  public strokeLinearGradient({ x1 = 0, y1 = 0, x2 = 0, y2 = 0, gradient = [] }: LinearGradient, lineWidth: number): this {
    if (gradient.length > 0) {
      let stroke: CanvasGradient = this.ctx.createLinearGradient(x1, y1, x2, y2)
      for (let stop of gradient) {
        if (stop.pos < 0 || stop.pos > 1) throw new Error('Invalid colorstop position.')
        if (stop.color instanceof Color)
          stop.color = stop.color.hex

        stroke.addColorStop(stop.pos, stop.color satisfies string)
      }

      this.ctx.lineWidth = lineWidth
      this.ctx.strokeStyle = stroke
      this.ctx.stroke()
    }

    return this
  }
  public strokeRadialGradient({ x1 = 0, y1 = 0, r1 = 0, x2 = 0, y2 = 0, r2 = 0, gradient = [] }: RadialGradient, lineWidth: number): this {
    if (gradient.length > 0) {
      let stroke: CanvasGradient = this.ctx.createRadialGradient(x1, y1, r1, x2, y2, r2)
      for (let stop of gradient) {
        if (stop.pos < 0 || stop.pos > 1) throw new Error('Invalid colorstop position.')
        if (stop.color instanceof Color)
          stop.color = stop.color.hex

        stroke.addColorStop(stop.pos, stop.color satisfies string)
      }

      this.ctx.lineWidth = lineWidth
      this.ctx.strokeStyle = stroke
      this.ctx.stroke()
    }

    return this
  }
  public measureText(text: string, size: number): TextMetrics {
    this.ctx.font = `${this.ctx.style} ${size}px ${this.ctx.family}`
    return this.ctx.measureText(text)
  }
  public flip(direction: 'horizontal' | 'vertical', restore: boolean = true): this {
    this.restore = restore
    this.ctx.save()

    let centerX: number = this.x + this.width * 0.5
    let centerY: number = this.y + this.height * 0.5
    this.ctx.translate(centerX, centerY)

    let scaleX: number = direction === 'horizontal' ? -1 : 1
    let scaleY: number = direction === 'vertical' ? -1 : 1
    this.ctx.scale(scaleX, scaleY)

    this.ctx.translate(-centerX, -centerY)

    return this
  }
  public endTransform(force: boolean = false): void {
    if (this.restore || force) {
      this.ctx.restore()
      this.restore = false
    }
  }
}

export const Rect = class extends Element {
  public static draw({ x = 0, y = 0, width = 0, height = 0 }: RectangleInterface) {
    return new Rect(x, y, width, height)
  }
  constructor(x: number, y: number, width: number, height: number) {
    super()

    this.x = x
    this.y = y
    this.width = width
    this.height = height

    this.draw()
  }
  private draw(): void {
    this.ctx.beginPath()
    this.ctx.rect(this.x, this.y, this.width, this.height)
  }
}

export const RoundRect = class extends Element {
  public static draw({ x = 0, y = 0, width = 0, height = 0, radii = 0 }: RoundRectangleInterface) {
    return new RoundRect(x, y, width, height, radii)
  }
  private radii: Radii
  constructor(x: number, y: number, width: number, height: number, radii: Radii) {
    super()

    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.radii = radii

    this.draw()
  }
  private draw(): void {
    this.ctx.beginPath()
    this.ctx.roundRect(this.x, this.y, this.width, this.height, this.radii)
  }
}

export const Line = class extends Element {
  public static draw({ x1 = 0, y1 = 0, x2 = 0, y2 = 0 }: LineInterface) {
    return new Line(x1, y1, x2, y2)
  }
  private x1: number
  private y1: number
  private x2: number
  private y2: number
  constructor(x1: number, y1: number, x2: number, y2: number) {
    super()

    this.x1 = x1
    this.y1 = y1
    this.x2 = x2
    this.y2 = y2

    this.draw()
  }
  private draw(): void {
    this.ctx.beginPath()
    this.ctx.moveTo(this.x1, this.y1)
    this.ctx.lineTo(this.x2, this.y2)
  }
}

export const Arc = class extends Element {
  public static draw({ x = 0, y = 0, radius = 1, startAngle = 0, endAngle = 0 }: CurveInterface) {
    return new Arc(x, y, radius, startAngle, endAngle)
  }
  private radius: number
  private startAngle: number
  private endAngle: number
  constructor(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    super()

    this.x = x
    this.y = y
    this.radius = radius
    this.startAngle = startAngle
    this.endAngle = endAngle

    this.draw()
  }
  private draw(): void {
    this.ctx.beginPath()
    this.ctx.arc(this.x, this.y, this.radius, this.startAngle, this.endAngle)
  }
}

export const Circle = class extends Element {
  static draw({ x = 0, y = 0, radius = 1 }: CurveInterface) {
    return new Circle(x, y, radius)
  }
  private radius: number
  constructor(x: number, y: number, radius: number) {
    super()

    this.x = x
    this.y = y
    this.radius = radius

    this.draw()
  }
  private draw(): void {
    this.ctx.beginPath()
    this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
  }
}

export const Text = class extends Element {
  public static draw({ x = 0, y = 0, size = 0, text = '', align = 'center' as CanvasTextAlign, style = global.fontConfig.style, family = global.fontConfig.family, fitToWidth = null, fitToHeight = null }: TextInterface) {
    return new Text(x, y, text, size, align, style, family, fitToWidth, fitToHeight)
  }
  private size: number
  private text: string
  private align: CanvasTextAlign
  private style: string
  private family: string
  private metrics: TextMetrics
  private fitToWidth: number
  private fitToHeight: number
  constructor(x: number, y: number, text: string, size?: number, align?: CanvasTextAlign, style?: string, family?: string, fitToWidth?: number, fitToHeight?: number) {
    super()

    this.x = x
    this.y = y
    this.size = size
    this.text = text
    this.align = align
    this.style = style
    this.ctx.style = style
    this.family = family
    this.ctx.family = family

    this.metrics = this.measureText(this.text, 128)
    this.fitToWidth = fitToWidth
    this.fitToHeight = fitToHeight

    this.draw()
  }
  private fitToArea(): number {
    let aspectRatio: number = this.metrics.width / 128
    let maxSizeWidth: number = this.fitToWidth / aspectRatio
    return Math.min(maxSizeWidth, this.fitToHeight)
  }
  private draw(): void {
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
    this.ctx.textAlign = this.align
    this.ctx.font = `${this.style} ${this.fitToWidth || this.fitToHeight ? this.fitToArea() : this.size}px ${this.family}`

    this.ctx.beginPath()
    this.setCache({
      type: 'text',
      run: ({ fill = null, stroke = null, lineWidth = null, }: CacheFunction) => {
        this.ctx.save()
        this.ctx.translate(this.x, this.y)

        if (stroke != null) {
          this.ctx.strokeStyle = stroke
          this.ctx.lineWidth = lineWidth
          this.ctx.strokeText(this.text, 0, 0)
        }
        if (fill != null) {
          this.ctx.fillStyle = fill
          this.ctx.fillText(this.text, 0, 0)
        }

        this.ctx.restore()
      }
    })
  }
}

export const Bar = class extends Element {
  public static draw({ x = 0, y = 0, width = 0, height = 0 }: RectangleInterface) {
    return new Bar(x, y, width, height)
  }
  constructor(x: number, y: number, width: number, height: number) {
    super()

    this.x = x
    this.y = y
    this.width = width
    this.height = height

    this.draw()
  }
  private draw(): void {
    this.ctx.beginPath()
    this.setCache({
      type: 'bar',
      run: ({ fill, stroke, lineWidth }: CacheFunction) => {
        this.ctx.lineCap = 'round'
        Line.draw({
          x1: this.x + this.height * 0.5, y1: this.y + this.height * 0.5,
          x2: this.x + this.width - this.height * 0.5, y2: this.y + this.height * 0.5
        }).stroke(stroke, this.height + lineWidth)
        Line.draw({
          x1: this.x + this.height * 0.5, y1: this.y + this.height * 0.5,
          x2: this.x + this.width - this.height * 0.5, y2: this.y + this.height * 0.5
        }).stroke(fill, this.height)
      }
    })
  }
}

export const Clip = class extends Element {
  public static rect({ x = 0, y = 0, width = 0, height = 0 }: RectangleInterface) {
    return new Clip('rect', { x, y, width, height })
  }
  public static circle({ x = 0, y = 0, radius = 0 }: CurveInterface) {
    return new Clip('circle', { x, y, radius })
  }
  public static poly(path: Array<Pair<number>>) {
    return new Clip('path', { x: 0, y: 0, width: 0, height: 0 }, path)
  }
  public static end() {
    let clip = Clip.instances.pop()
    clip.ctx.restore()
  }
  public static instances: Array<any> = []

  private type: ClipType
  private radius: number
  private path: Array<Pair<number>>
  constructor(type: ClipType, { x = 0, y = 0, width = 0, height = 0, radius = 0 }, path?: Array<Pair<number>>) {
    super()
    Clip.instances.push(this)

    this.type = type

    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.radius = radius
    this.path = path

    this.ctx.save()
    this.ctx.beginPath()
    this.clip()
    this.ctx.clip()
  }
  private clip(): void {
    if (this.type === 'circle') {
      this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    } else if (this.type === 'rect') {
      this.ctx.rect(this.x, this.y, this.width, this.height)
    } else {
      let [sx, sy] = this.path.shift()
      this.ctx.moveTo(sx, sy)

      for (let [x, y] of this.path)
        this.ctx.lineTo(x, y)
    }
  }
}

export const Poly = class extends Element {
  static draw(path: Array<Pair<number>> = []) {
    return new Poly(path)
  }
  private path: Array<Pair<number>>
  constructor(path: Array<Pair<number>>) {
    super()

    this.path = path

    this.draw()
  }
  private draw(): void {
    this.ctx.beginPath()

    let [sx, sy] = this.path.shift()
    this.ctx.moveTo(sx, sy)

    for (let [x, y] of this.path)
      this.ctx.lineTo(x, y)
  }
}

export const Media = class extends Element {
  public static async draw({ x = 0, y = 0, width = 0, height = 0, dir = '' }: MediaInterface) {
    return await new Media(x, y, width, height, dir).draw()
  }
  private dir: string | HTMLImageElement
  constructor(x: number, y: number, width: number, height: number, dir: string) {
    super()

    this.x = x
    this.y = y
    this.width = width
    this.height = height

    this.dir = dir
  }
  private async draw(): Promise<any> {
    this.ctx.beginPath()
    this.ctx.drawImage(typeof this.dir === 'string' ? await loadImage(this.dir) : this.dir, this.x, this.y, this.width, this.height)

    return Rect.draw({
      x: this.x, y: this.y,
      width: this.width, height: this.height
    })
  }
}

export const Background = class extends Element {
  public static fill(color: any = '#ffffff') {
    return new Background(color)
  }
  private color: any
  constructor(color: any) {
    super()

    this.color = color

    this.draw()
  }
  private draw(): void {
    this.ctx.beginPath()
    this.ctx.rect(0, 0, this.canvas.width, this.canvas.height)
    this.fill(this.color)
  }
}

export const MazeWall = class extends Element {
  public static draw({ x = 0, y = 0, width = 0, height = 0 }: Wall) {
    return new MazeWall(x, y, width, height)
  }
  constructor(x: number, y: number, width: number, height: number) {
    super()

    this.x = x
    this.y = y
    this.width = width
    this.height = height

    this.draw()
  }
  private draw(): void {
    this.setCache({
      type: 'rect',
      run: ({ fill = null, stroke = null, lineWidth = null, }: CacheFunction) => {
        Rect.draw({
          x: this.x, y: this.y,
          width: this.width, height: this.height
        }).fill(stroke)

        let innerX = this.x + lineWidth * 0.5
        let innerY = this.y + lineWidth * 0.5
        let innerWidth = this.width - lineWidth
        let innerHeight = this.height - lineWidth

        Rect.draw({
          x: innerX, y: innerY,
          width: innerWidth, height: innerHeight
        }).fill(fill)
      }
    })
  }
}

export const MazeMap = class {
  private maze: MazeInterface
  constructor(maze: MazeInterface) {
    this.maze = maze
  }
  public draw({ x, y, width, height }: MapDimensions): void {
    let border = 5
    Rect.draw({
      x, y,
      width, height
    }).alpha(0.85).fill(Colors.white)
    Rect.draw({
      x, y,
      width, height
    }).stroke(Colors.black, border)

    let wallWidth = (width - border * 0.5) / this.maze.width
    let wallHeight = (height - border * 0.5) / this.maze.height

    for (let wall of this.maze.walls) {
      MazeWall.draw({
        x: x + wall.x * wallWidth, y: y + wall.y * wallHeight,
        width: wall.width * wallWidth, height: wall.height * wallHeight
      }).both(Colors.wall, Color.blend(Colors.wall, Colors.black, 0.2), 3)
    }
  }
}

export const Heart = class extends Element {
  static draw({ x = 0, y = 0, width = 1, height = 1 }: RectangleInterface, parent?: any) {
    return new Heart(x, y, width, height, parent)
  }
  private readonly parent: any
  private readonly context: CanvasRenderingContext2D
  constructor(x: number, y: number, width: number, height: number, parent: any) {
    super()
    this.parent = parent

    this.x = x
    this.y = y
    this.width = width
    this.height = height

    this.context = parent?.ctx ?? this.ctx

    this.draw()
  }
  private drawContext(): void {
    this.x += this.width * 0.5
    let topHeight: number = this.height * 0.3
    let top: number = this.y + topHeight
    let left: number = this.x - this.width * 0.5
    let right: number = this.x + this.width * 0.5

    this.context.moveTo(this.x, top)
    this.context.bezierCurveTo(
      this.x, this.y,
      left, this.y,
      left, top
    )
    this.context.bezierCurveTo(
      left, this.y + (this.height + topHeight) * 0.5,
      this.x, this.y + (this.height + topHeight) * 0.5,
      this.x, this.y + this.height
    )
    this.context.bezierCurveTo(
      this.x, this.y + (this.height + topHeight) * 0.5,
      right, this.y + (this.height + topHeight) * 0.5,
      right, top
    )
    this.context.bezierCurveTo(
      right, this.y,
      this.x, this.y,
      this.x, top
    )
  }
  private draw(): void {
    if (!this.parent) {
      this.setCache({
        type: 'heart',
        run: ({ fill = null, stroke = null, lineWidth = null, }: CacheFunction) => {
          this.context.beginPath()

          this.drawContext()

          this.context.closePath()
          this.context.restore()

          if (stroke instanceof Color)
            stroke = stroke.hex

          if (stroke != null) {
            this.context.strokeStyle = stroke as CanvasColor
            this.context.lineWidth = lineWidth
            this.context.stroke()
          }
          if (fill instanceof Color)
            fill = fill.hex

          if (fill != null) {
            this.context.fillStyle = fill as CanvasColor
            this.context.fill()
          }
        }
      })
    } else {
      this.drawContext()
    }
  }
}

export const Stem = class extends Element {
  static draw({ x = 0, y = 0, width = 1, height = 1 }: RectangleInterface, parent?: any) {
    return new Stem(x, y, width, height, parent)
  }
  private readonly context: CanvasRenderingContext2D
  constructor(x: number, y: number, width: number, height: number, parent: any) {
    super()

    this.x = x
    this.y = y
    this.width = width
    this.height = height

    this.context = parent?.ctx ?? this.ctx

    this.draw()
  }
  private draw(): void {
    let top: number = this.y - this.height * 0.5
    let bottom: number = this.y + this.height * 0.5
    let stemLeft: number = this.x - this.width * 0.25
    let stemRight: number = this.x + this.width * 0.25

    // stem
    this.context.moveTo(stemLeft, bottom)
    this.context.bezierCurveTo(
      this.x, bottom,
      this.x, top,
      stemLeft, top,
    )
    this.context.lineTo(stemRight, top)
    this.context.moveTo(stemRight, top)
    this.context.bezierCurveTo(
      this.x, top,
      this.x, bottom,
      stemRight, bottom,
    )
    this.context.lineTo(stemLeft, bottom)
  }
}

export const Club = class extends Element {
  static draw({ x = 0, y = 0, width = 1, height = 1 }: RectangleInterface) {
    return new Club(x, y, width, height)
  }
  constructor(x: number, y: number, width: number, height: number) {
    super()

    this.x = x
    this.y = y
    this.width = width
    this.height = height

    this.draw()
  }
  private draw(): void {
    let centerX: number = this.x + this.width * 0.5
    let centerY: number = this.y + this.height * 0.5
    let leafSize: number = this.width * 0.25
    this.setCache({
      type: 'club',
      run: ({ fill = null, stroke = null, lineWidth = null, }: CacheFunction) => {
        this.ctx.beginPath()
        // leaves
        this.ctx.moveTo(centerX + this.width * 0.25, centerY + this.height * 0.1)
        this.ctx.arc(centerX + this.width * 0.25, centerY + this.height * 0.1, leafSize, 0, Math.PI * 2)
        this.ctx.moveTo(centerX, centerY - this.height * 0.25)

        this.ctx.arc(centerX, centerY - this.height * 0.25, leafSize, 0, Math.PI * 2)
        this.ctx.moveTo(centerX - this.width * 0.25, centerY + this.height * 0.1)
        this.ctx.arc(centerX - this.width * 0.25, centerY + this.height * 0.1, leafSize, 0, Math.PI * 2)

        this.ctx.closePath()

        // stem
        Stem.draw({
          x: centerX, y: this.y + this.height * 0.75,
          width: this.width * 0.75, height: this.height * 0.5
        }, this)

        this.ctx.restore()

        if (stroke != null) {
          this.ctx.strokeStyle = stroke
          this.ctx.lineWidth = lineWidth
          this.ctx.stroke()
        }
        if (fill != null) {
          this.ctx.fillStyle = fill
          this.ctx.fill()
        }
      }
    })
  }
}

export const Spade = class extends Element {
  static draw({ x = 0, y = 0, width = 1, height = 1 }: RectangleInterface) {
    return new Spade(x, y, width, height)
  }
  constructor(x: number, y: number, width: number, height: number) {
    super()

    this.x = x
    this.y = y
    this.width = width
    this.height = height

    this.draw()
  }
  private draw(): void {
    this.setCache({
      type: 'spade',
      run: ({ fill = null, stroke = null, lineWidth = null, }: CacheFunction) => {
        this.ctx.beginPath()
        Heart.draw({
          x: this.x, y: this.y + this.height * 0.2,
          width: this.width, height: this.height * 0.8
        }, this)
        this.ctx.closePath()

        // stem
        let top: number = this.y + this.height * 0.5
        let bottom: number = this.y
        let stemLeft: number = this.x + this.width * 0.25
        let stemRight: number = this.x + this.width * 0.75

        this.ctx.moveTo(stemLeft, bottom)
        this.ctx.bezierCurveTo(
          stemLeft + this.width * 0.25, bottom,
          stemLeft + this.width * 0.25, top,
          stemLeft, top,
        )
        this.ctx.lineTo(stemRight, top)
        this.ctx.moveTo(stemRight, top)
        this.ctx.bezierCurveTo(
          stemRight - this.width * 0.25, top,
          stemRight - this.width * 0.25, bottom,
          stemRight, bottom,
        )
        this.ctx.lineTo(stemLeft, bottom)
        this.ctx.restore()

        if (stroke != null) {
          this.ctx.strokeStyle = stroke
          this.ctx.lineWidth = lineWidth
          this.ctx.stroke()
        }
        if (fill != null) {
          this.ctx.fillStyle = fill
          this.ctx.fill()
        }
      }
    })
  }
}

export const Pattern = class extends Element {
  static draw({ x = 0, y = 0, width = 1, height = 1 }: RectangleInterface) {
    return new Pattern(x, y, width, height)
  }
  constructor(x: number, y: number, width: number, height: number) {
    super()

    this.x = x
    this.y = y
    this.width = width
    this.height = height

    this.draw()
  }
  private draw(): void {
    let spacing: number = this.height / 12
    Clip.rect({
      x: this.x, y: this.y,
      width: this.width, height: this.height
    })
    for (let i = 0; i < 16; i++) {
      Line.draw({
        x1: this.x, y1: this.y + spacing * i,
        x2: this.x + this.width, y2: this.y + spacing * i + this.height,
      }).stroke(Colors.black, this.width / 32)
      Line.draw({
        x1: this.x, y1: this.y - spacing * i,
        x2: this.x + this.width, y2: this.y - spacing * i + this.height,
      }).stroke(Colors.black, this.width / 32)

      Line.draw({
        x1: this.x + this.width, y1: this.y + spacing * i,
        x2: this.x, y2: this.y + spacing * i + this.height,
      }).stroke(Colors.black, this.width / 32)
      Line.draw({
        x1: this.x + this.width, y1: this.y - spacing * i,
        x2: this.x, y2: this.y - spacing * i + this.height,
      }).stroke(Colors.black, this.width / 32)
    }
    Clip.end()
  }
}

export const Card = class extends Element {
  public static draw({ x = 0, y = 0, size = 1,  }: CardImageInterface, suit: Suit, rank: PlayingCard, facing: number) {
    return new Card(x, y, size, suit, rank, facing)
  }
  public suit: Suit
  public rank: PlayingCard
  public facing: number
  private flipInterpolator: InterpolatorInterface
  constructor(x: number, y: number, size: number, suit: Suit, rank: PlayingCard, facing: number) {
    super()

    this.suit = suit
    this.rank = rank
    this.facing = facing

    this.x = x
    this.y = y
    this.width = size
    this.height = size * 1.5

    this.flipInterpolator = new Interpolator(Ease.Linear, 6)
    this.draw()
  }
  private drawFace(border: number): void {
    let borderColor = ['h', 'd'].includes(this.suit) ? Color.blend(Colors.error, Colors.black, 0.6) : Color.blend(Colors.darkGray, Colors.black, 0.6)
    let symbolSize: number = this.width * 0.15
    let spacing: number = symbolSize * 0.125

    switch (this.suit) {
      case Suits.Clubs:
        this.ctx.save()

        Club.draw({
          x: this.x + spacing * 2, y: this.y + spacing * 2,
          width: symbolSize, height: symbolSize,
        }).both(Colors.darkGray, borderColor, border)
        Club.draw({
          x: this.x + this.width - spacing * 2 - symbolSize, y: this.y + this.height - spacing * 2 - symbolSize,
          width: symbolSize, height: symbolSize,
        }).flip('vertical', false).both(Colors.darkGray, borderColor, border)

        this.endTransform(true)
        break
      case Suits.Spades:
        this.ctx.save()

        Spade.draw({
          x: this.x + spacing * 2, y: this.y + spacing * 2,
          width: symbolSize, height: symbolSize,
        }).flip('vertical', false).both(Colors.darkGray, borderColor, border)
        Spade.draw({
          x: this.x + this.width - spacing * 2 - symbolSize, y: this.y + this.height - spacing * 2 - symbolSize,
          width: symbolSize, height: symbolSize,
        }).both(Colors.darkGray, borderColor, border)

        this.endTransform(true)
        break
      case Suits.Diamonds:
        let symbolX = this.x + spacing + symbolSize * 0.6
        let symbolY = this.y + spacing + symbolSize * 0.6
        Poly.draw([
          [symbolX - symbolSize * 0.4, symbolY],
          [symbolX, symbolY - symbolSize * 0.5],
          [symbolX + symbolSize * 0.4, symbolY],
          [symbolX, symbolY + symbolSize * 0.5],
          [symbolX - symbolSize * 0.4, symbolY],
        ]).both(Colors.error, borderColor, border)
        symbolX = this.x + this.width - spacing * 2 - symbolSize * 0.6
        symbolY = this.y + this.height - spacing * 2 - symbolSize * 0.6
        Poly.draw([
          [symbolX - symbolSize * 0.4, symbolY],
          [symbolX, symbolY - symbolSize * 0.5],
          [symbolX + symbolSize * 0.4, symbolY],
          [symbolX, symbolY + symbolSize * 0.5],
          [symbolX - symbolSize * 0.4, symbolY],
        ]).both(Colors.error, borderColor, border)

        this.endTransform(true)
        break
      case Suits.Hearts:
        this.ctx.save()

        Heart.draw({
          x: this.x + spacing * 2, y: this.y + spacing * 2,
          width: symbolSize, height: symbolSize,
        }).both(Colors.error, borderColor, border)
        Heart.draw({
          x: this.x + this.width - spacing * 2 - symbolSize, y: this.y + this.height - spacing * 2 - symbolSize,
          width: symbolSize, height: symbolSize,
        }).flip('vertical', false).both(Colors.error, borderColor, border)

        this.endTransform(true)
        break
    }

    Text.draw({
      x: this.x + this.width * 0.5, y: this.y + this.width * 0.9,
      size: this.width * 0.5,
      text: typeof this.rank === 'number' ? this.rank.toString() : this.rank.toUpperCase(),
      align: 'center',
      family: 'Ubuntu', style: 'bold',
    }).both(['h', 'd'].includes(this.suit) ? Colors.error : Colors.darkGray, borderColor, border)
  }
  private drawBack(border: number): void {
    Pattern.draw({
      x: this.x + border, y: this.y + border,
      width: this.width - border * 2, height: this.height - border * 2,
    })
  }
  private draw(): void {
    let border: number = 4
    this.ctx.save()

    let scaleX: number = Math.cos(this.flipInterpolator.get(this.facing) * Math.PI)

    this.ctx.translate(this.x + this.width * 0.5, this.y + this.height * 0.5)
    this.ctx.scale(scaleX, 1)
    this.ctx.translate(-this.x - this.width * 0.5, -this.y - this.height * 0.5)

    RoundRect.draw({
      x: this.x, y: this.y,
      width: this.width, height: this.height,
      radii: [this.width / 10, this.width / 10, this.width / 10, this.width / 10],
    }).both(Colors.white, Color.blend(Colors.white, Colors.black, 0.6), border * 2)

    if (this.flipInterpolator.get(this.facing) < 0.5) {
      this.drawBack(border)
    } else {
      this.drawFace(border)
    }

    this.endTransform(true)
  }
}
