import { OGLRenderingContext, Program } from "ogl"

import MAP_DEBUG_FRAGMENT_SHADER from "./shader/index.frag"
import MAP_DEBUG_VERTEX_SHADER from "./shader/index.vert"

export const getMapDebugProgram = (gl: OGLRenderingContext) => {
  const program = new Program(gl, {
    vertex: MAP_DEBUG_VERTEX_SHADER,
    fragment: MAP_DEBUG_FRAGMENT_SHADER
  })
  program.uniforms.uMap = { value: null }
  return program
}
