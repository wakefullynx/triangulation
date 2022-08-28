import { DelaunayTriangulation } from '../src/delaunay-triangulation'
import { Distribution } from '../src/distributions'
import Delaunator from 'delaunator'
import {voronoi} from 'd3-voronoi'

describe('uniform', () => {
  const points = Distribution.uniform(50000, 0, 100)

  test('delaunay-triangulation', () => {
    console.time('delaunay-triangulation')
    const t = new DelaunayTriangulation(DelaunayTriangulation.arrayGetter(points))
    points.forEach((v, i) => t.add(i))
    console.timeEnd('delaunay-triangulation')
  })

  test('delaunay-triangulation bulk', () => {
    console.time('delaunay-triangulation bulk')
    const t = new DelaunayTriangulation(DelaunayTriangulation.arrayGetter(points))
    t.addBulk(points.map((v, i) => i))
    console.timeEnd('delaunay-triangulation bulk')
  })

  test('d3-voronoi', () => {
    const coords = points.flat()
    console.time('d3-voronoi')
    const t = voronoi()(points)
    console.timeEnd('d3-voronoi')
  })

  test('delaunator', () => {
    console.time('delaunator')
    const t = Delaunator.from(points)
    console.timeEnd('delaunator')
  })
})

describe('circle', () => {
  const points = Distribution.circle(50000, 1e10)

  test('delaunay-triangulation', () => {
    console.time('delaunay-triangulation')
    const t = new DelaunayTriangulation(DelaunayTriangulation.arrayGetter(points))
    points.forEach((v, i) => t.add(i))
    console.timeEnd('delaunay-triangulation')
  })

  test('delaunay-triangulation bulk', () => {
    console.time('delaunay-triangulation bulk')
    const t = new DelaunayTriangulation(DelaunayTriangulation.arrayGetter(points))
    t.addBulk(points.map((v, i) => i))
    console.timeEnd('delaunay-triangulation bulk')
  })

  test('d3-voronoi', () => {
    console.time('d3-voronoi')
    const t = voronoi()(points)
    console.timeEnd('d3-voronoi')
  })

  test('delaunator', () => {
    console.time('delaunator')
    const t = Delaunator.from(points)
    console.timeEnd('delaunator')
  })
})