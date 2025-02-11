import { Mat4, OGLRenderingContext, Program, Vec3 } from "ogl"

import RARMARCH_FRAGMENT from "./shader/index.frag"
import RARMARCH_VERTEX from "./shader/index.vert"

export function getRaymarchProgram(gl: OGLRenderingContext) {
  const program = new Program(gl, {
    fragment: RARMARCH_FRAGMENT,
    vertex: RARMARCH_VERTEX
  })

  const pyramidMatrix = new Mat4()
  pyramidMatrix.rotate(Math.PI / 4, new Vec3(0, 1, 0))
  pyramidMatrix.rotate(Math.PI / 5, new Vec3(1, 0, 0))

  program.uniforms.uPyramidMatrix = { value: pyramidMatrix }

  return program
}
