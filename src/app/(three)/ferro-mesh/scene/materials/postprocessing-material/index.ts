import * as THREE from "three"
import { RawShaderMaterial } from "three"

import fragmentShader from "./shader/index.frag"
import vertexShader from "./shader/index.vert"

export function createPostprocessingMaterial() {
  return new RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader,
    fragmentShader,
    uniforms: {
      baseMap: { value: null },
      bloomThreshold: { value: 50.0 },
      bloomIntensity: { value: .001 },
      bloomRadius: { value: 15. },
      bloomSamples: { value: 64 }
    }
  })
} 