import { GLSL3, RawShaderMaterial } from "three"

import fragmentShader from "./shader/index.frag"
import vertexShader from "./shader/index.vert"

export const getMapDebugProgram = () => {
  const program = new RawShaderMaterial({
    vertexShader,
    fragmentShader,
    glslVersion: GLSL3,
    uniforms: {
      uMap: { value: null }
    }
  })
  return program
}
