import { OGLRenderingContext, Program } from "ogl"

import FLOW_FRAGMENT_SHADER from "./shader/index.frag"
import FLOW_VERTEX_SHADER from "./shader/index.vert"

export const getFlowProgram = (gl: OGLRenderingContext) => {
  const program = new Program(gl, {
    vertex: FLOW_VERTEX_SHADER,
    fragment: FLOW_FRAGMENT_SHADER
  })
  program.uniforms.uFlowFeedBackTexture = { value: null }
  program.uniforms.uTime = { value: 0.0 }
  return program
}


