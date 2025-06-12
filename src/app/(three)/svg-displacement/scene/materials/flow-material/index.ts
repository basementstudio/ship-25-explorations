import * as THREE from "three"

import fragmentShader from "./shader/index.frag"
import vertexShader from "./shader/index.vert"

export function createFlowMaterial(
  flowFeedbackTexture: THREE.Texture,
  textureSize: number
) {
  const m = new THREE.RawShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uFlowFeedBackTexture: { value: flowFeedbackTexture },
      uMouse: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(textureSize, textureSize) },
      uFrame: { value: 0 },
      uMouseVelocity: { value: 0 }
    }
  })

  return m
}
