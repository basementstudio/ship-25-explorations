import vertexShader from "./shader/index.vert"
import fragmentShader from "./shader/index.frag"
import { GLSL3, RawShaderMaterial } from "three"

export function createFlowNormalMaterial() {
  const material = new RawShaderMaterial({
    uniforms: {
      uHeightmap: { value: null },
    },
    vertexShader,
    fragmentShader,
    glslVersion: GLSL3,
  })

  return material
}
