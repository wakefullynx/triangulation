import { DelaunayTriangulation } from '../src/delaunay-triangulation'
import Delaunator from 'delaunator'
import { Distribution } from '../src/distributions'

describe('uniform', () => {
  const points = Distribution.uniform(5000, 0, 100)

  test('delaunay-triangulation', () => {
    console.time('bench')
    const t = new DelaunayTriangulation(DelaunayTriangulation.arrayGetter(points))
    points.forEach((v, i) => t.add(i))
    console.timeEnd('bench')
  })

  test('delaunator', () => {
    const coords = points.flat()
    console.time('bench')
    const t = new Delaunator(coords)
    console.timeEnd('bench')
  })
})

describe('uniform', () => {
  const points = Distribution.circle(5000, 1e10)

  test('delaunay-triangulation', () => {
    console.time('bench')
    const t = new DelaunayTriangulation(DelaunayTriangulation.arrayGetter(points))
    points.forEach((v, i) => t.add(i))
    console.timeEnd('bench')
  })

  test('delaunator', () => {
    const coords = points.flat()
    console.time('bench')
    const t = new Delaunator(coords)
    console.timeEnd('bench')
  })
})