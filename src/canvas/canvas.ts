import {
  createCanvas, registerFont
} from 'canvas'

export interface NodeCanvasInterface {
  canvas: any
  ctx: CanvasRenderingContext2D

  width: number
  height: number
  centerX: number
  centerY: number
  scale: number
  ratio: number
}

interface Viewport {
  x: number,
  y: number,
  width: number,
  height: number,
}

registerFont('../eula-bot/src/utilities/fonts/Ubuntu-Bold.ttf', { family: 'Ubuntu', weight: '16', style: 'bold' })

export const NodeCanvas = class NodeCanvasInterface {
  static activeCanvas = null

  public canvas: any
  public ctx: CanvasRenderingContext2D

  public width: number
  public height: number
  public centerX: number
  public centerY: number
  public scale: number
  public ratio: number
  constructor(width: number, height: number, scale: number = 1) {
    this.canvas = createCanvas(width, height)
    this.ctx = this.canvas.getContext('2d')
    this.ctx.lineJoin = 'round'

    this.width = width
    this.height = height
    this.scale = scale

    this.centerX = width * 0.5
    this.centerY = height * 0.5

    this.ratio = this.setSize()

    NodeCanvas.activeCanvas = this
  }
  public setSize(): number {
    let cWidth: number = Math.ceil(this.width * this.scale)
    let cHeight: number = Math.ceil(this.height * this.scale)
    this.canvas.width = cWidth
    this.canvas.height = cHeight
    //this.canvas.style.width = `${cWidth / this.scale}px`
    //this.canvas.style.height = `${cHeight / this.scale}px`

    this.ctx.lineJoin = 'round'

    return this.width / this.height
  }
  public setViewport({ x = 0, y = 0, width = 0, height = 0 }: Viewport): void {
    let sx: number = this.width * this.scale / width
    let sy: number = this.height * this.scale / height
    this.ctx.setTransform(sx, 0, 0, sy, -x * sx, -y * sy)
  }
}
