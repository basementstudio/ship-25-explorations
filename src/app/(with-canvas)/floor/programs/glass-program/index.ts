import { OGLRenderingContext, Program } from "ogl"

import GLASS_FRAGMENT from "./shader/index.frag"
import GLASS_VERTEX from "./shader/index.vert"

export function getGlassProgram(gl: OGLRenderingContext) {
  const program = new Program(gl, {
    fragment: GLASS_FRAGMENT,
    vertex: GLASS_VERTEX
  })

  return program
}
