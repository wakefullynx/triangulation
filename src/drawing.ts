import { Vertex } from "./definitions";
import { DelaunayTriangulation } from "./delaunay-triangulation";

export { drawDelaunayTriangulation }

function drawDelaunayTriangulation(t: DelaunayTriangulation, pointRadius: number, edgeWidth: number) {
  const circles: Vertex[] = []
  const edges: [Vertex, Vertex][] = []
  for(let [a, bc] of t.triangles.entries()) {
    if(a === DelaunayTriangulation.GHOST_VERTEX) {
      continue
    }
    circles.push(t.coordinates(a))
    for(let [b, c] of bc) {
      if(b === DelaunayTriangulation.GHOST_VERTEX) {
        continue
      }
      if(c === DelaunayTriangulation.GHOST_VERTEX) {
        continue
      }
      edges.push([t.coordinates(a), t.coordinates(b)])
      edges.push([t.coordinates(b), t.coordinates(c)])
      edges.push([t.coordinates(c), t.coordinates(a)])
    }
  }

  const circleObjects = circles.map(c => `<circle cx="${c[0]}" cy="${c[1]}" r="${pointRadius}"/>`)
  const edgeObjects = edges.map(e => `<line x1="${e[0][0]}" y1="${e[0][1]}" x2="${e[1][0]}" y2="${e[1][1]}" stroke-width="${edgeWidth}" stroke="#000" />`)
  const objects = `${circleObjects} ${edgeObjects}`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="-100 -100 200 200">${objects}</svg>`
  return svg
}