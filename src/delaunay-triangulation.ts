import { incircle, orient2d } from "robust-predicates"
import { CoordinatesGetter, Edge, Edges, Point, Triangle, Vertex, VertexID, Vertices } from "./definitions"

export { DelaunayTriangulation }

class DelaunayTriangulation {
  #triangles: Map<VertexID, Map<VertexID, VertexID>>

  static readonly GHOST_VERTEX = -1
  coordinates: CoordinatesGetter

  #nearLastChange: VertexID = DelaunayTriangulation.GHOST_VERTEX

  constructor(coordinates: CoordinatesGetter) {
    this.#triangles = new Map<VertexID, Map<VertexID, VertexID>>()
    this.#triangles.set(DelaunayTriangulation.GHOST_VERTEX, new Map<VertexID, VertexID>())
    this.coordinates = coordinates
  }

  static arrayGetter(array: Vertices) {
    return (i: number) => array[i]
  }

  addBulk(v: VertexID[]) {
    const sorted = v.sort((a, b) => {
      const [ax, ay] = this.coordinates(a)
      const [bx, by] = this.coordinates(b)
      if(ax - bx === 0) {
        return ay - by
      } else {
        return ax - bx
      }
    })

    sorted.forEach(s => this.add(s))
  }

  add(v: VertexID) {
    this.#triangles.set(v, new Map<VertexID, VertexID>())
    if(this.#triangles.size === 2) {
      this.#nearLastChange = v
    } else if(this.#triangles.size === 3) {
      const a = [...this.#triangles.keys()][1]
      this.#addTriangle(a, v, DelaunayTriangulation.GHOST_VERTEX)
      this.#addTriangle(v, a, DelaunayTriangulation.GHOST_VERTEX)
      this.#nearLastChange = v
    } else if(this.#triangles.size === 4) {
      const [a, b] = [...this.#triangles.keys()].slice(-3, -1)
      this.#deleteTriangle(a, b, DelaunayTriangulation.GHOST_VERTEX)
      this.#deleteTriangle(b, a, DelaunayTriangulation.GHOST_VERTEX)
      const o = orient2d(...this.coordinates(a), ...this.coordinates(b), ...this.coordinates(v))
      if(o < 0) {
        this.#addTriangle(a, b, v)
        this.#addTriangle(b, a, DelaunayTriangulation.GHOST_VERTEX)
        this.#addTriangle(v, b, DelaunayTriangulation.GHOST_VERTEX)
        this.#addTriangle(a, v, DelaunayTriangulation.GHOST_VERTEX)
      } else if (o > 0) {
        this.#addTriangle(b, a, v)
        this.#addTriangle(a, b, DelaunayTriangulation.GHOST_VERTEX)
        this.#addTriangle(b, v, DelaunayTriangulation.GHOST_VERTEX)
        this.#addTriangle(v, a, DelaunayTriangulation.GHOST_VERTEX)
      } else {
        throw 'TBI'
      }
      this.#nearLastChange = v
    } else {
      const [a, b, c] = this.#walk(this.#nearLastChange, this.coordinates(v))
      this.#addWithLocation(v, a, b, c)
      this.#nearLastChange = v
    }
  }

  #walk(start: VertexID, target: Point): Triangle {
    const boundary: (Edge | VertexID)[] = [start]
    let sx: number = 0, sy: number = 0
    let i = 0
    while(true) {
      const next = boundary.pop()
      if(next !== undefined) {
        if(Array.isArray(next)) {
          const [a, b] = next
          const x = this.#triangles.get(b)!.get(a)!
          if(x === DelaunayTriangulation.GHOST_VERTEX || this.triangleCircumdiskContains(b, a, x, target)) {
            return [b, a, x]
          } else {
            const [xx, xy] = this.coordinates(x)
            const xo = orient2d(sx, sy, target[0], target[1], xx, xy)
            if(xo < 0) {
              boundary.push([a, x])
            } else if(xo > 0) {
              boundary.push([x, b])
            } else {
              boundary.push(x)
            }
          }
        } else {
          [sx, sy] = this.coordinates(next)
          for(let [b, c] of this.#triangles.get(next)?.entries()!) {
            if(this.triangleCircumdiskContains(next, b, c, target)) {
              return [next, b, c]
            }
          }

          for(let [b, c] of this.#triangles.get(next)?.entries()!) {
            if(b !== DelaunayTriangulation.GHOST_VERTEX && c !== DelaunayTriangulation.GHOST_VERTEX) {
              const bo = orient2d(sx, sy, target[0], target[1], ...this.coordinates(b))
              const co = orient2d(sx, sy, target[0], target[1], ...this.coordinates(c))

              if(bo === 0 && co < 0) {
                boundary.push(b)
                break
              }

              if(co === 0 && bo > 0) {
                boundary.push(c)
                break
              }

              if(bo > 0 && co < 0) {
                boundary.push([b, c])
                break
              }
            }
          }
        }
      } else {
        throw 'Faulty triangulation'
      }
    }
  }

  #addWithLocation(v: VertexID, a: VertexID, b: VertexID, c: VertexID) {
    this.#deleteTriangle(a, b, c)

    const boundary: Edges = [
      [c, a],
      [b, c],
      [a, b]
    ]

    while(true) {
      const edge = boundary.pop()
      if(edge !== undefined) {
        const [a, b] = edge
        const x = this.#triangles.get(b)?.get(a)
        if(x !== undefined) {
          if(this.triangleCircumdiskContains(v, a, b, x)) {
            this.#deleteTriangle(a, x, b)
            boundary.push([x, b], [a, x])
          } else {
            this.#addTriangle(v, a, b)
          }
        }
      } else {
        break
      }

    }
  }

  #deleteTriangle(a: VertexID, b: VertexID, c: VertexID) {
    this.#triangles.get(a)?.delete(b)
    this.#triangles.get(b)?.delete(c)
    this.#triangles.get(c)?.delete(a)
  }

  #addTriangle(a: VertexID, b: VertexID, c: VertexID) {
    this.#triangles.get(a)?.set(b, c)
    this.#triangles.get(b)?.set(c, a)
    this.#triangles.get(c)?.set(a, b)
  }

  remove(v: VertexID) {

  }

  update(v: VertexID) {
    this.remove(v)
    this.add(v)
  }

  triangleCircumdiskContains(va: VertexID, vb: VertexID, vc: VertexID, v: Point | VertexID) {
    if(Array.isArray(v)) {
      return this.triangleCircumdiskContainsPoint(va, vb, vc, v)
    } else {
      return this.triangleCircumdiskContainsVertex(va, vb, vc, v)
    }
  }

  triangleCircumdiskContainsPoint(va: VertexID, vb: VertexID, vc: VertexID, v: Point) {
    if(va === DelaunayTriangulation.GHOST_VERTEX) {
      return orient2d(...this.coordinates(vb), ...this.coordinates(vc), ...v) <= 0 
    } else if(vb === DelaunayTriangulation.GHOST_VERTEX) {
      return orient2d(...this.coordinates(vc), ...this.coordinates(va), ...v) <= 0 
    } else if(vc === DelaunayTriangulation.GHOST_VERTEX) {
      return orient2d(...this.coordinates(va), ...this.coordinates(vb), ...v) <= 0 
    } else {
      return incircle(...this.coordinates(va), ...this.coordinates(vb), ...this.coordinates(vc), ...v) > 0
    }
  }

  triangleCircumdiskContainsVertex(va: VertexID, vb: VertexID, vc: VertexID, v: VertexID) {
    if(va === DelaunayTriangulation.GHOST_VERTEX) {
      return orient2d(...this.coordinates(vb), ...this.coordinates(vc), ...this.coordinates(v)) <= 0 
    } else if(vb === DelaunayTriangulation.GHOST_VERTEX) {
      return orient2d(...this.coordinates(vc), ...this.coordinates(va), ...this.coordinates(v)) <= 0 
    } else if(vc === DelaunayTriangulation.GHOST_VERTEX) {
      return orient2d(...this.coordinates(va), ...this.coordinates(vb), ...this.coordinates(v)) <= 0 
    } else if(v === DelaunayTriangulation.GHOST_VERTEX) {
      return orient2d(...this.coordinates(va), ...this.coordinates(vc), ...this.coordinates(vb)) <= 0 
    } else {
      return incircle(...this.coordinates(va), ...this.coordinates(vb), ...this.coordinates(vc), ...this.coordinates(v)) > 0
    }
  }
}