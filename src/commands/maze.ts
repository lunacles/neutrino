import { AttachmentBuilder } from 'discord.js'
import {
  NodeCanvas,
  NodeCanvasInterface
} from '../canvas/canvas.js'
import { MazeMap } from '../canvas/elements'
import {
  Algorithm,
  Maze,
  PlacementType
} from '../mazes/maze.js'
import { PRNG } from '../utilities/prng.js'

const generateMaze = (algorithm: Algorithm, seed: string, width: number, height: number): any => {
  let c: NodeCanvasInterface = new NodeCanvas(width * 32, height * 32)
  const maze = new Maze()
    .setWidth(width)
    .setHeight(height)
    .fill(PlacementType.Empty)
    .setPRNG(PRNG.simple)
    .setSeed(seed)

  const map = new MazeMap(maze)
  maze.runAlgorithm(
    algorithm
  ).findPockets().combineWalls()
  map.draw({
    x: 0, y: 0,
    width: width * 32, height: height * 32
  })

  let buffer: Buffer = c.canvas.toBuffer('image/png')
  let attachment = new AttachmentBuilder(buffer, {
    name: 'maze.png'
  })

  return [attachment, maze.seed]
}

export default generateMaze
