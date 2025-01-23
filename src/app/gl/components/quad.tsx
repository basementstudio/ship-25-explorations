import { OGLElements } from "react-ogl"

// Single triangle that covers the entire screen (-1 to 1 space)
// Using a larger triangle that extends beyond the screen to ensure full coverage
const positionData = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0])
const uvData = new Float32Array([0, 0, 2, 0, 0, 2])
// No index buffer needed for a single triangle
const indexData = new Uint16Array([0, 1, 2])

export function QuadGeometry(props: OGLElements["geometry"]) {
  return (
    <geometry
      position={{
        size: 3,
        data: positionData
      }}
      uv={{ size: 2, data: uvData }}
      index={{ data: indexData }}
      {...(props as any)}
    />
  )
}
