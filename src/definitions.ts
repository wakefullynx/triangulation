export type { VertexID, Vertex, Vertices, Point, CoordinatesGetter, Edge, Edges, Triangle }

type VertexID = number
type Vertex = [number, number]
type Point = [number, number]
type Vertices = Vertex[]
type CoordinatesGetter = (vertex: VertexID) => Vertex
type Edge = [VertexID, VertexID]
type Edges = Edge[]
type Triangle = [VertexID, VertexID, VertexID]