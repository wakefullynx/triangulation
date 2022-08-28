import seedrandom from 'seedrandom'
import { Vertices } from '../src/definitions'

export { Distribution }

class Distribution {
  static uniform(amount: number, min: number = 0 , max: number = 1, rng?: seedrandom.PRNG): Vertices {
    const random = rng ?? seedrandom()
    return [...Array(amount).keys()].map(_ => [min + random.double() * (max - min), min + random.double() * (max - min)])
  }

  static circle(amount: number, radius: number): Vertices {
    return [...Array(amount).keys()].map(i => [Math.cos(i * 2 * Math.PI / amount) * radius, Math.sin(i * 2 * Math.PI / amount) * radius])
  }
}