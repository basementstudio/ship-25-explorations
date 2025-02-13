import { OGLRenderingContext, Program } from "ogl"

import fragment from "./shader/index.frag"
import vertex from "./shader/index.vert"

export function getParticlesProgram(gl: OGLRenderingContext) {
  const program = new Program(gl, {
    vertex,
    fragment,
    transparent: true,
    depthTest: false,
    cullFace: false
  })

  program.blendEquation = {
    modeRGB: gl.FUNC_ADD,
    modeAlpha: gl.FUNC_ADD
  }

  program.blendFunc = {
    src: gl.ONE,
    dst: gl.ONE
  }

  return program
}
