import { OGLElements } from "react-ogl"

const positionData = new Float32Array([-1, 1, 0, -1, -1, 0, 1, 1, 0, 1, -1, 0])
const uvData = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0])
const indexData = new Uint16Array([0, 1, 2, 1, 3, 2])

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
