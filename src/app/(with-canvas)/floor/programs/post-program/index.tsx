import { OGLRenderingContext, Program } from "ogl"

import POST_FRAGMENT from "./shader/index.frag"
import POST_VERTEX from "./shader/index.vert"

export const getPostProgram = (gl: OGLRenderingContext) => {
  const program = new Program(gl, {
    vertex: POST_VERTEX,
    fragment: POST_FRAGMENT
  })
  return program
}
