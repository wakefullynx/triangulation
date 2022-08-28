import { Distribution } from '../src/distributions'
import Delaunator from 'delaunator'
import { DelaunayTriangulation } from '../src/delaunay-triangulation'
import { writeTriangulationFile } from './utils'
import { Vertex, Vertices } from '../src/definitions'
import * as fs from 'fs'
import seedrandom from 'seedrandom'


function drawDelaunator(delaunator: Delaunator<Vertex>, points: Vertices) {
  const triangles = delaunator.triangles
  const circles: Vertices = []
  const edges: [Vertex, Vertex][] = []
  const pointRadius = 2
  const edgeWidth = 1
  for (let i = 0; i < triangles.length; i += 3) {
    circles.push(points[triangles[i]], points[triangles[i + 1]], points[triangles[i + 2]])
    edges.push([points[triangles[i]], points[triangles[i + 1]]], [points[triangles[i + 1]], points[triangles[i + 2]]], [points[triangles[i + 2]], points[triangles[i]]])
  }

  const circleObjects = circles.map(c => `<circle cx="${c[0]}" cy="${c[1]}" r="${pointRadius}"/>`)
  const edgeObjects = edges.map(e => `<line x1="${e[0][0]}" y1="${e[0][1]}" x2="${e[1][0]}" y2="${e[1][1]}" stroke-width="${edgeWidth}" stroke="#000" />`)
  const objects = `${circleObjects} ${edgeObjects}`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="-100 -100 200 200">${objects}</svg>`
  return svg
}

function writeDelaunatorFile(delaunator: Delaunator<Vertex>, points: Vertices, file: string) {
  const svg = drawDelaunator(delaunator, points)
  fs.writeFileSync(file, svg)
}

describe('visual', () => {
  test('uniform', () => {
    const seed = '1264'
    const rng = seedrandom(seed)
    const points = Distribution.uniform(50, -100, 100, rng)
    const t = new DelaunayTriangulation(DelaunayTriangulation.arrayGetter(points))
    points.forEach((v, i) => {
      t.add(i)
      writeTriangulationFile(t, `./images/visual_uniform_${i}.svg`)
    })
    

    const coords = points.flat()
    const delaunator = new Delaunator(coords)
    writeDelaunatorFile(delaunator, points, './images/visual_uniform_delaunator.svg')
  })
})