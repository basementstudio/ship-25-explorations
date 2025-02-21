"use client"

import {
  createPortal,
  ThreeEvent,
  useFrame,
  useThree
} from "@react-three/fiber"
import { useCallback, useEffect, useMemo } from "react"
import * as THREE from "three"

import { useMaterials } from "./use-materials"
import { useTargets } from "./use-targets"
import { PerspectiveCamera } from "@react-three/drei"
import { useAssets } from "./use-assets"
export function Scene() {
  const sceneCamera = useThree(
    (state) => state.camera
  ) as THREE.PerspectiveCamera

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
  const assets = useAssets()
  const materials = useMaterials(targets, assets, sceneCamera)
  const { flowMaterial, flowNormalMaterial } = materials

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
  useFrame(({ gl, camera, scene, clock }, _delta, frame) => {
    // Update uniformsscene
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

    gl.render(scene, camera)
  }, 1)

  const flowScene = useMemo(() => new THREE.Scene(), [])

  useEffect(() => {
    sceneCamera.lookAt(0, 0, 0.5)
  }, [sceneCamera])

  return (
    <>
      {createPortal(
        <mesh>
          <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
          <primitive object={flowMaterial} />
        </mesh>,
        flowScene
      )}
      <mesh
        rotation={[Math.PI / -2, 0, 0]}
        position={[0, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerOver={() => (vRefs.shouldReset = true)}
      >
        <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
        <primitive object={flowNormalMaterial} />
      </mesh>
      {/* @ts-expect-error: some type issue */}
      <PerspectiveCamera makeDefault position={[0, 1, 2]} />
    </>
  )
}

const PLANE_SIZE = 4
