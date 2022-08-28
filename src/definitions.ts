export type { VertexID, Vertex, Vertices, CoordinatesGetter, Edge, Triangle }

type VertexID = number
type Vertex = [number, number]
type Vertices = Vertex[]
type CoordinatesGetter = (vertex: VertexID) => Vertex
type Edge = [VertexID, VertexID]
type Triangle = [VertexID, VertexID, VertexID]