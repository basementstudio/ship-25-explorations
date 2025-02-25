import { GLSL3, RawShaderMaterial } from "three"

import fragmentShader from "./shader/index.frag"
import vertexShader from "./shader/index.vert"

export function createOrbeRaymarchMaterial() {
  return new RawShaderMaterial({
    vertexShader,
    fragmentShader,
    glslVersion: GLSL3,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 }
    }
  })
}
