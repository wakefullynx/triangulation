import { DelaunayTriangulation } from "../src/delaunay-triangulation";
import { drawDelaunayTriangulation } from '../src/drawing'
import * as fs from 'fs'

export { writeTriangulationFile }

function writeTriangulationFile(t: DelaunayTriangulation, file: string) {
  const svg = drawDelaunayTriangulation(t, 2, 1)
  fs.writeFileSync(file, svg)
}