import { RawShaderMaterial } from "three"

import fragmentShader from "./shader/index.frag"
import vertexShader from "./shader/index.vert"

export const getMapDebugProgram = () => {
  const program = new RawShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uMap: { value: null }
    }
  })
  return program
}
