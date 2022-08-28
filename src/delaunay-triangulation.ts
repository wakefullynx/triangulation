import { incircle, orient2d } from "robust-predicates"
import { CoordinatesGetter, Edge, Triangle, VertexID, Vertices } from "./definitions"

export { DelaunayTriangulation }

class DelaunayTriangulation {
  #triangles: Map<VertexID, Map<VertexID, VertexID>>

  static readonly GHOST_VERTEX = -1
  coordinates: CoordinatesGetter

  constructor(coordinates: CoordinatesGetter) {
    this.#triangles = new Map<VertexID, Map<VertexID, VertexID>>()
    this.#triangles.set(DelaunayTriangulation.GHOST_VERTEX, new Map<VertexID, VertexID>())
    this.coordinates = coordinates
  }

  static arrayGetter(array: Vertices) {
    return (i: number) => array[i]
  }

  add(v: VertexID) {
    this.#triangles.set(v, new Map<VertexID, VertexID>())
    if(this.#triangles.size === 2) {
      return
    } else if(this.#triangles.size === 3) {
      const a = [...this.#triangles.keys()][1]
      this.#addTriangle(a, v, DelaunayTriangulation.GHOST_VERTEX)
      this.#addTriangle(v, a, DelaunayTriangulation.GHOST_VERTEX)
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
    } else {
      for(let [a, bc] of this.#triangles.entries()) {
        for(let [b, c] of bc) {
          if(this.triangleCircumdiskContains(a, b, c, v)) {
            return this.#addWithLocation(v, a, b, c)
          }
        }
      }
    }
  }

  #addWithLocation(v: VertexID, a: VertexID, b: VertexID, c: VertexID) {
    this.#deleteTriangle(a, b, c)
    this.#dig(v, a, b)
    this.#dig(v, b, c)
    this.#dig(v, c, a)
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

  #dig(v: VertexID, a: VertexID, b: VertexID) {
    const x = this.#triangles.get(b)?.get(a)
    if(x === undefined) {
      return
    }

    if(this.triangleCircumdiskContains(v, a, b, x)) {
      this.#deleteTriangle(a, x, b)
      this.#dig(v, a, x)
      this.#dig(v, x, b)
    } else {
      this.#addTriangle(v, a, b)
    }
  }

  remove(v: VertexID) {

  }

  update(v: VertexID) {
    this.remove(v)
    this.add(v)
  }

  triangleCircumdiskContains(va: VertexID, vb: VertexID, vc: VertexID, v: VertexID) {
    if(va === DelaunayTriangulation.GHOST_VERTEX) {
      return orient2d(...this.coordinates(vb), ...this.coordinates(vc), ...this.coordinates(v)) <= 0 
    } else if(vb === DelaunayTriangulation.GHOST_VERTEX) {
      return orient2d(...this.coordinates(vc), ...this.coordinates(va), ...this.coordinates(v)) <= 0 
    } else if(vc === DelaunayTriangulation.GHOST_VERTEX) {
      return orient2d(...this.coordinates(va), ...this.coordinates(vb), ...this.coordinates(v)) <= 0 
    } else if(v === DelaunayTriangulation.GHOST_VERTEX) {
      return false
    } else {
      return incircle(...this.coordinates(va), ...this.coordinates(vb), ...this.coordinates(vc), ...this.coordinates(v)) > 0
    }
  }

  get triangles() {
    return this.#triangles
  }
}