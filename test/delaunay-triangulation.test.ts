import { Vertex, VertexID, Vertices } from '../src/definitions'
import { DelaunayTriangulation } from '../src/delaunay-triangulation'
import { writeTriangulationFile } from './utils'

describe('add', () => {
  const vertices = (array: Vertices) => {
    return (v: VertexID): Vertex => array[v]
  }
  test('construct', () => {
    const v: Vertices = []
    const getter = vertices(v)
    const t = new DelaunayTriangulation(getter)
  })

  test('single', () => {
    const v: Vertices = [[0, 0]]
    const getter = vertices(v)
    const t = new DelaunayTriangulation(getter)
    t.add(0)
  })

  test('double', () => {
    const v: Vertices = [[0, 0], [1, 0]]
    const getter = vertices(v)
    const t = new DelaunayTriangulation(getter)
    t.add(0)
    t.add(1)
  })

  test('triple', () => {
    const v: Vertices = [[0, 0], [1, 0], [0, 1]]
    const getter = vertices(v)
    const t = new DelaunayTriangulation(getter)
    t.add(0)
    t.add(1)
    t.add(2)
    writeTriangulationFile(t, './images/add_triple.svg')
  })

  test('four', () => {
    const v: Vertices = [[0, 0], [1, 0], [0, 1], [2, 2]]
    const getter = vertices(v)
    const t = new DelaunayTriangulation(getter)
    t.add(0)
    t.add(1)
    t.add(2)
    t.add(3)
    writeTriangulationFile(t, './images/add_four.svg')
  })

  test('four#2', () => {
    const v: Vertices = [[0, 0], [10, 0], [0, -10], [20, -20]]
    const getter = vertices(v)
    const t = new DelaunayTriangulation(getter)
    t.add(0)
    t.add(1)
    t.add(2)
    t.add(3)
    writeTriangulationFile(t, './images/add_four2.svg')
  })

  test('center', () => {
    const v: Vertices = [[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0.5]]
    const getter = vertices(v)
    const t = new DelaunayTriangulation(getter)
    t.add(0)
    t.add(1)
    t.add(2)
    t.add(3)
    t.add(4)
    writeTriangulationFile(t, './images/add_center.svg')
  })

  test('cross', () => {
    const v: Vertices = [[0, 0], [1, 0], [1, 1], [0, 1], [0.3, 0.5]]
    const getter = vertices(v)
    const t = new DelaunayTriangulation(getter)
    t.add(0)
    t.add(1)
    t.add(2)
    t.add(3)
    t.add(4)
    writeTriangulationFile(t, './images/add_cross.svg')
  })
})

describe('triangleCircumdiskContains', () => {
  const vertices = (array: Vertices) => {
    return (v: VertexID): Vertex => array[v]
  }
  const getter = vertices([[0, 0], [1, 0], [0, 1], [2, 2]])
  const t = new DelaunayTriangulation(getter)
  test('#1', () => {
    expect(t.triangleCircumdiskContains(0, 1, 2, getter(3))).toBe(false)
  })

  test('#2', () => {
    expect(t.triangleCircumdiskContains(-1, 2, 1, getter(3))).toBe(true)
  })

  test('#3', () => {
    expect(t.triangleCircumdiskContains(2, -1, 1, getter(3))).toBe(false)
  })

  test('#4', () => {
    expect(t.triangleCircumdiskContains(1, 2, -1, getter(3))).toBe(false)
  })

  test('#5', () => {
    expect(t.triangleCircumdiskContains(1, -1, 2, getter(3))).toBe(true)
  })

  test('#6', () => {
    expect(t.triangleCircumdiskContains(3, -1, 2, getter(0))).toBe(false)
  })
})