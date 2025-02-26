import * as THREE from "three"
import { RawShaderMaterial } from "three"

import fragmentShader from "./shader/index.frag"
import vertexShader from "./shader/index.vert"

export function createFerroMeshMaterial() {
  return new RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader,
    fragmentShader,
    wireframe: true,
    uniforms: {
      uTime: { value: Math.PI }
    }
  })
}
