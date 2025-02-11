import { OGLRenderingContext, Program } from "ogl"

import INSIDE_FRAGMENT from "./shader/index.frag"
import INSIDE_VERTEX from "./shader/index.vert"

export function getInsideProgram(gl: OGLRenderingContext) {
  const program = new Program(gl, {
    fragment: INSIDE_FRAGMENT,
    vertex: INSIDE_VERTEX,
    cullFace: gl.FRONT,
    transparent: true
  })

  return program
}
