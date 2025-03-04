import * as THREE from "three"
import { RawShaderMaterial } from "three"

import { maxParticles } from "../../fluid-sim"
import fragmentShader from "./shader/index.frag"
import vertexShader from "./shader/index.vert"

export function createFerroMeshMaterial() {
  return new RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader,
    fragmentShader,
    wireframe: true,
    defines: {
      MAX_PARTICLES: maxParticles
    },
    uniforms: {
      uTime: { value: Math.PI },
      uDiskRadius: { value: 1 },
      uHeightMax: { value: 0.4 },
      uHeightMin: { value: 0.15 },
      uMainPyramidRadius: { value: 0.6 },
      uMainPyramidHeight: { value: 0.5 },
      uMousePosition: { value: new THREE.Vector3(0, 20, 20) },
      uParticlesPositions: {
        value: null
      }
    }
  })
}
