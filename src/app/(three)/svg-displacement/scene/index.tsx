"use client"

import { createPortal, ThreeEvent, useFrame } from "@react-three/fiber"
import { useCallback, useMemo } from "react"
import * as THREE from "three"

import { useMaterials } from "./use-materials"
import { useTargets } from "./use-targets"
export function Scene() {
  const vRefs = useMemo(
    () => ({
      uv: new THREE.Vector2(),
      smoothUv: new THREE.Vector2(),
      prevSmoothUv: new THREE.Vector2(),
      velocity: new THREE.Vector2(),
      shouldReset: true
    }),
    []
  )

  const targets = useTargets()
  const { flowFbo } = targets
  const materials = useMaterials(targets)
  const { flowMaterial } = materials

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.uv) {
      vRefs.uv.copy(e.uv)
    }
  }, [])

  // smooth mouse
  useFrame((_, delta) => {
    if (vRefs.shouldReset) {
      vRefs.smoothUv.copy(vRefs.uv)
      vRefs.prevSmoothUv.copy(vRefs.uv)
      vRefs.shouldReset = false
    }

    vRefs.prevSmoothUv.copy(vRefs.smoothUv)
    vRefs.smoothUv.lerp(vRefs.uv, delta * 10)
    vRefs.velocity.subVectors(vRefs.smoothUv, vRefs.prevSmoothUv)
  })

  // Update flow simulation
  useFrame(({ gl, camera, clock }, _delta, frame) => {
    // Update uniforms
    flowMaterial.uniforms.uMouse.value.set(vRefs.smoothUv.x, vRefs.smoothUv.y)
    flowMaterial.uniforms.uFlowFeedBackTexture.value = flowFbo.read.texture
    flowMaterial.uniforms.uMouseVelocity.value = vRefs.velocity.length()
    flowMaterial.uniforms.uFrame.value = frame
    flowMaterial.uniforms.uTime.value = clock.getElapsedTime()

    // Render flow sim
    gl.setRenderTarget(flowFbo.write)
    gl.render(flowScene, camera)
    gl.setRenderTarget(null)

    flowFbo.swap()
  })

  const flowScene = useMemo(() => new THREE.Scene(), [])

  return (
    <>
      {createPortal(
        <mesh>
          <planeGeometry args={[2, 2]} />
          <primitive object={flowMaterial} />
        </mesh>,
        flowScene
      )}
      <mesh
        position={[0, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerOver={() => (vRefs.shouldReset = true)}
      >
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial map={flowFbo.read.texture} />
      </mesh>
    </>
  )
}
