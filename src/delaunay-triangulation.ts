import { incircle, orient2d } from "robust-predicates"
import { CoordinatesGetter, Edge, Edges, Point, Triangle, Vertex, VertexID, Vertices } from "./definitions"
import { writeTriangulationFile } from "../test/utils"

export { DelaunayTriangulation }

class DelaunayTriangulation {
  #triangles: Map<VertexID, Map<VertexID, VertexID>>
  #edges: Map<VertexID, Set<VertexID>>

  static readonly GHOST_VERTEX = -1
  coordinates: CoordinatesGetter

  #nearLastChange: VertexID = DelaunayTriangulation.GHOST_VERTEX

  constructor(coordinates: CoordinatesGetter) {
    this.#triangles = new Map<VertexID, Map<VertexID, VertexID>>()
    this.#triangles.set(DelaunayTriangulation.GHOST_VERTEX, new Map<VertexID, VertexID>())
    this.#edges = new Map<VertexID, Set<VertexID>>()
    this.#edges.set(DelaunayTriangulation.GHOST_VERTEX, new Set<VertexID>())
    this.coordinates = coordinates
  }

  static arrayGetter(array: Vertices) {
    return (i: number) => array[i]
  }

  get triangles() {
    return this.#triangles
  }

  addBulk(v: VertexID[]) {
    const sorted = v.sort((a, b) => {
      const [ax, ay] = this.coordinates(a)
      const [bx, by] = this.coordinates(b)
      if (ax - bx === 0) {
        return ay - by
      } else {
        return ax - bx
      }
    })

    sorted.forEach(s => this.add(s))
  }

  add(v: VertexID) {
    this.#triangles.set(v, new Map<VertexID, VertexID>())
    if (this.#triangles.size === 2) {
      this.#nearLastChange = v
    } else if (this.#triangles.size === 3) {
      const a = [...this.#triangles.keys()][1]
      this.#addTriangle(a, v, DelaunayTriangulation.GHOST_VERTEX)
      this.#addTriangle(v, a, DelaunayTriangulation.GHOST_VERTEX)
      this.#nearLastChange = v
    } else if (this.#triangles.size === 4) {
      const [a, b] = [...this.#triangles.keys()].slice(-3, -1)
      this.#deleteTriangle(a, b, DelaunayTriangulation.GHOST_VERTEX)
      this.#deleteTriangle(b, a, DelaunayTriangulation.GHOST_VERTEX)
      const o = orient2d(...this.coordinates(a), ...this.coordinates(b), ...this.coordinates(v))
      if (o < 0) {
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

  addSegment(va: VertexID, vb: VertexID) {
    const [leftsequence, rightsequence]: [VertexID[], VertexID[]] = [[], []]
    let [nextleft, nextright]: [VertexID?, VertexID?] = []

    const [vax, vay] = this.coordinates(va)
    const [vbx, vby] = this.coordinates(vb)
    for (let [b, c] of this.#triangles.get(va)?.entries()!) {
      if (vb == b || vb === c) {
        this.#edges.get(va)?.add(vb)
        this.#edges.get(vb)?.add(va)
        return true
      }

      if (b !== DelaunayTriangulation.GHOST_VERTEX && c !== DelaunayTriangulation.GHOST_VERTEX) {
        const bo = orient2d(vax, vay, vbx, vby, ...this.coordinates(b))
        const co = orient2d(vax, vay, vbx, vby, ...this.coordinates(c))

        if (bo > 0 && co < 0) {
          [nextleft, nextright] = [c, b]
          break
        }
      }
    }

    this.#deleteTriangle(va, nextright!, nextleft!)
    while (true) {
      const x = this.#triangles.get(nextleft!)!.get(nextright!)!
      this.#deleteTriangle(x, nextleft!, nextright!)
      if(x === vb) {
        leftsequence.push(nextleft!)
        rightsequence.push(nextright!)
        this.#edges.get(va)?.add(vb)
        this.#edges.get(vb)?.add(va)
        this.#deleteTriangle(vb, nextleft!, nextright!)
        break
      }

      const [xx, xy] = this.coordinates(x)
      const xo = orient2d(vax, vay, vbx, vby, xx, xy)
      if (xo < 0) {
        leftsequence.push(nextleft!)
        ;[nextleft, nextright] = [x, nextright]
      } else if (xo > 0) {
        rightsequence.push(nextright!)
        ;[nextleft, nextright] = [nextleft, x]
      } else {
        return false
      }
    }

    this.#fillCavity([vb, ...leftsequence.reverse(), va])
    this.#fillCavity([va, ...rightsequence, vb])
  }

  #fillCavity(sequence: VertexID[]) {
    const perm = new Map<number, VertexID>(sequence.map((s, i) => [i, s]))
    const sn = perm.size
    const triangles = new Map<VertexID, Map<VertexID, VertexID>>([...perm.values()].map(v => [v, new Map<VertexID, VertexID>()]))
    const addTriangle = (a: VertexID, b: VertexID, c: VertexID) => {
      triangles.get(a)?.set(b, c)
      triangles.get(b)?.set(c, a)
      triangles.get(c)?.set(a, b)
    }

    const deleteTriangle = (a: VertexID, b: VertexID, c: VertexID) => {
      triangles.get(a)?.delete(b)
      triangles.get(b)?.delete(c)
      triangles.get(c)?.delete(a)
    }

    const previous = new Map<number, number>()
    const next = new Map<number, number>()
    for (let i = 0; i < sn; i++) {
      const vi = perm.get(i)!
      previous.set(vi, perm.get((i - 1) < 0 ? sn - 1 : i - 1)!)
      next.set(vi, perm.get((i + 1) % sn)!)
    }

    const [firstCoords, lastCoords] = [this.coordinates(perm.get(0)!), this.coordinates(perm.get(sn - 1)!)]
    const closeness = new Map<VertexID, number>([...perm.entries()].map(([k, v]) => [k, orient2d(...firstCoords, ...this.coordinates(v), ...lastCoords)]))

    for(let i = sn - 2; i > 1; i--) {
      let vi
      for(let j = i - 1; j > 0; j--) {
        vi = perm.get(i)!
        const [previousi, nexti] = [previous.get(vi)!, next.get(vi)!]
        if(closeness.get(vi)! >= closeness.get(previousi)! || closeness.get(vi)! >= closeness.get(nexti)!) {
          break
        }
        const vj = perm.get(j)!
        const [previousj, nextj] = [previous.get(vj)!, next.get(vj)!]
        perm.set(i, vj)
        perm.set(j, vi)
      }

      vi = perm.get(i)!
      next.set(previous.get(vi)!, next.get(vi)!)
      previous.set(next.get(vi)!, previous.get(vi)!)
    }

    addTriangle(perm.get(0)!, perm.get(1)!, perm.get(sn - 1)!)

    for(let i = 2; i < sn - 1; i++) {
      const vi = perm.get(i)!
      this.#fillCavityInsert(vi, next.get(vi)!, previous.get(vi)!, triangles, addTriangle, deleteTriangle)
    }

    ;[...triangles.entries()].forEach(([a, ma]) => {
      const va = this.#triangles.get(a)!
      ;[...ma.entries()].forEach(([b, c]) => va.set(b, c))
    })
  }

  #fillCavityInsert(v: VertexID, a: VertexID, b: VertexID, triangles: Map<VertexID, Map<VertexID, VertexID>>, addTriangle: (a: number, b: number, c: number) => void, deleteTriangle: (a: number, b: number, c: number) => void) {
    const x = triangles.get(b)!.get(a)

    if(x === undefined || (orient2d(...this.coordinates(v), ...this.coordinates(a), ...this.coordinates(b)) <= 0 && incircle(...this.coordinates(v), ...this.coordinates(a), ...this.coordinates(b), ...this.coordinates(x)) <= 0)) {
      addTriangle(v, a, b)
      return
    } else {
      deleteTriangle(b, a, x)
      this.#fillCavityInsert(v, a, x, triangles, addTriangle, deleteTriangle)
      this.#fillCavityInsert(v, x, b, triangles, addTriangle, deleteTriangle)
      return
    }
  }

  #walk(start: VertexID, target: Point): Triangle {
    const boundary: (Edge | VertexID)[] = [start]
    let sx: number = 0, sy: number = 0
    let i = 0
    while (true) {
      const next = boundary.pop()
      if (next !== undefined) {
        if (Array.isArray(next)) {
          const [a, b] = next
          const x = this.#triangles.get(b)!.get(a)!
          if (x === DelaunayTriangulation.GHOST_VERTEX || this.triangleCircumdiskContains(b, a, x, target)) {
            return [b, a, x]
          } else {
            const [xx, xy] = this.coordinates(x)
            const xo = orient2d(sx, sy, target[0], target[1], xx, xy)
            if (xo < 0) {
              boundary.push([a, x])
            } else if (xo > 0) {
              boundary.push([x, b])
            } else {
              boundary.push(x)
            }
          }
        } else {
          [sx, sy] = this.coordinates(next)
          for (let [b, c] of this.#triangles.get(next)?.entries()!) {
            if (this.triangleCircumdiskContains(next, b, c, target)) {
              return [next, b, c]
            }
          }

          for (let [b, c] of this.#triangles.get(next)?.entries()!) {
            if (b !== DelaunayTriangulation.GHOST_VERTEX && c !== DelaunayTriangulation.GHOST_VERTEX) {
              const bo = orient2d(sx, sy, target[0], target[1], ...this.coordinates(b))
              const co = orient2d(sx, sy, target[0], target[1], ...this.coordinates(c))

              if (bo === 0 && co < 0) {
                boundary.push(b)
                break
              }

              if (co === 0 && bo > 0) {
                boundary.push(c)
                break
              }

              if (bo > 0 && co < 0) {
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

    while (true) {
      const edge = boundary.pop()
      if (edge !== undefined) {
        const [a, b] = edge
        const x = this.#triangles.get(b)?.get(a)
        if (x !== undefined) {
          if (this.triangleCircumdiskContains(v, a, b, x)) {
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
    //TODO: edge cases for n < 5, counting, closest
    const sequence: VertexID[] = []
    const neighbors = this.#triangles.get(v)

    if (neighbors === undefined) {
      return
    }

    const first = neighbors.entries().next().value[1]
    let current = first

    do {
      sequence.push(current)
      const prev = current
      current = neighbors.get(current)
      this.#deleteTriangle(v, prev, current)
    } while (current !== first)

    this.#triangles.delete(v)

    const previous = new Map<number, number>()
    const next = new Map<number, number>()

    const sn = sequence.length
    for (let i = 0; i < sn; i++) {
      previous.set(sequence[i], sequence[(i - 1) < 0 ? sn - 1 : i - 1])
      next.set(sequence[i], sequence[(i + 1) % sn])
    }

    for (let i = sn - 1; i > 2; i--) {
      const c = sequence[i]
      next.set(previous.get(c)!, next.get(c)!)
      previous.set(next.get(c)!, previous.get(c)!)
    }

    this.#addTriangle(first, next.get(first)!, previous.get(first)!)

    for (let i = 3; i < sn; i++) {
      const current = sequence[i]
      this.#rinsert(sequence, current, next.get(current)!, previous.get(current)!)
    }
  }

  #rinsert(s: VertexID[], a: VertexID, b: VertexID, c: VertexID) {
    const x = this.triangles.get(c)?.get(b)
    if (x !== undefined) {
      if (s.includes(x) && this.triangleCircumdiskContains(a, b, c, x)) {
        this.#deleteTriangle(c, b, x)
        this.#rinsert(s, a, b, x)
        this.#rinsert(s, a, x, c)
      } else {
        this.#addTriangle(a, b, c)
      }
    }
  }

  update(v: VertexID) {
    this.remove(v)
    this.add(v)
  }

  triangleCircumdiskContains(va: VertexID, vb: VertexID, vc: VertexID, v: Point | VertexID) {
    if (Array.isArray(v)) {
      return this.triangleCircumdiskContainsPoint(va, vb, vc, v)
    } else {
      return this.triangleCircumdiskContainsVertex(va, vb, vc, v)
    }
  }

  triangleCircumdiskContainsPoint(va: VertexID, vb: VertexID, vc: VertexID, v: Point) {
    if (va === DelaunayTriangulation.GHOST_VERTEX) {
      return orient2d(...this.coordinates(vb), ...this.coordinates(vc), ...v) <= 0
    } else if (vb === DelaunayTriangulation.GHOST_VERTEX) {
      return orient2d(...this.coordinates(vc), ...this.coordinates(va), ...v) <= 0
    } else if (vc === DelaunayTriangulation.GHOST_VERTEX) {
      return orient2d(...this.coordinates(va), ...this.coordinates(vb), ...v) <= 0
    } else {
      return incircle(...this.coordinates(va), ...this.coordinates(vb), ...this.coordinates(vc), ...v) > 0
    }
  }

  triangleCircumdiskContainsVertex(va: VertexID, vb: VertexID, vc: VertexID, v: VertexID) {
    if (va === DelaunayTriangulation.GHOST_VERTEX) {
      return orient2d(...this.coordinates(vb), ...this.coordinates(vc), ...this.coordinates(v)) <= 0
    } else if (vb === DelaunayTriangulation.GHOST_VERTEX) {
      return orient2d(...this.coordinates(vc), ...this.coordinates(va), ...this.coordinates(v)) <= 0
    } else if (vc === DelaunayTriangulation.GHOST_VERTEX) {
      return orient2d(...this.coordinates(va), ...this.coordinates(vb), ...this.coordinates(v)) <= 0
    } else if (v === DelaunayTriangulation.GHOST_VERTEX) {
      return orient2d(...this.coordinates(va), ...this.coordinates(vc), ...this.coordinates(vb)) <= 0
    } else {
      return incircle(...this.coordinates(va), ...this.coordinates(vb), ...this.coordinates(vc), ...this.coordinates(v)) > 0
    }
  }
}