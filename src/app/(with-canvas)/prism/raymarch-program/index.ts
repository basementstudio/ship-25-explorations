import { OGLRenderingContext, Program } from "ogl"

import RARMARCH_FRAGMENT from "./shader/index.frag"
import RARMARCH_VERTEX from "./shader/index.vert"

export function getRaymarchProgram(gl: OGLRenderingContext) {
  const program = new Program(gl, {
    fragment: RARMARCH_FRAGMENT,
    vertex: RARMARCH_VERTEX
  })

  return program
}
