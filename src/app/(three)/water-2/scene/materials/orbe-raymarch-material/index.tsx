import * as THREE from "three"

import fragmentShader from "./shader/index.frag"
import vertexShader from "./shader/index.vert"

export function createOrbeRaymarchMaterial() {
  return new THREE.RawShaderMaterial({
    vertexShader,
    fragmentShader,
    glslVersion: THREE.GLSL3,
    transparent: true,
    depthWrite: true,
    uniforms: {
      uTime: { value: 0 },
      uSphereMatrix: { value: new THREE.Matrix4() },
      uSphereMix: { value: 0 }
    }
  })
}
