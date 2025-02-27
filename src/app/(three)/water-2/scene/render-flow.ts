import * as THREE from "three"

import { DoubleFBO } from "./use-double-fbo"
import { LerpedMouse } from "./use-lerp-mouse"

export function renderFlow(
  gl: THREE.WebGLRenderer,
  camera: THREE.Camera,
  scene: THREE.Scene,
  clock: THREE.Clock,
  material: THREE.RawShaderMaterial,
  fbo: DoubleFBO,
  lerpedMouse: LerpedMouse,
  frameCount: number
) {
  const prevRenderTarget = gl.getRenderTarget()
  // Update uniforms
  material.uniforms.uMouse.value.set(
    lerpedMouse.smoothUv.x,
    lerpedMouse.smoothUv.y
  )
  material.uniforms.uFlowFeedBackTexture.value = fbo.read.texture
  material.uniforms.uMouseVelocity.value = lerpedMouse.velocity.length() * 100

  material.uniforms.uMouseDirection.value
    .set(lerpedMouse.velocity.x, lerpedMouse.velocity.y)
    .normalize()
  material.uniforms.uFrame.value = frameCount
  material.uniforms.uTime.value = clock.getElapsedTime()

  // Render flow sim
  gl.setRenderTarget(fbo.write)
  gl.render(scene, camera)
  gl.setRenderTarget(prevRenderTarget)
  fbo.swap()
}
