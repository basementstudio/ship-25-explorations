"use client"

import { OrbitControls, PerspectiveCamera, useFBO } from "@react-three/drei"
import {
  createPortal,
  ThreeEvent,
  useFrame,
  useThree
} from "@react-three/fiber"
import { useCallback, useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import { DebugTextures } from "./debug-textures"
import { useAssets } from "./use-assets"
import { useMaterials } from "./use-materials"
import { useTargets } from "./use-targets"

export const hitConfig = {
  scale: 1
}

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
  const { flowMaterial, raymarchMaterial } = materials

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (e.uv) {
        vRefs.uv.copy(e.uv)
      }
    },
    [vRefs]
  )

  // smooth mouse
  useFrame((_, delta) => {
    if (vRefs.shouldReset) {
      vRefs.smoothUv.copy(vRefs.uv)
      vRefs.prevSmoothUv.copy(vRefs.uv)
      vRefs.shouldReset = false
    }

    vRefs.prevSmoothUv.copy(vRefs.smoothUv)
    // console.log(delta * 50)

    vRefs.smoothUv.lerp(vRefs.uv, Math.min(delta * 50, 1))
    vRefs.velocity.subVectors(vRefs.smoothUv, vRefs.prevSmoothUv)
  })

  const frameCount = useRef(0)

  const screenFbo = useFBO()

  useEffect(() => {
    // for dev reasons, reset frame count when material gets reloaded
    frameCount.current = 0
  }, [flowMaterial, flowFbo])

  // Update flow simulation
  useFrame(({ gl, camera, scene, clock }, _delta) => {
    // Update uniforms
    flowMaterial.uniforms.uMouse.value.set(vRefs.smoothUv.x, vRefs.smoothUv.y)
    flowMaterial.uniforms.uFlowFeedBackTexture.value = flowFbo.read.texture
    flowMaterial.uniforms.uMouseVelocity.value = vRefs.velocity.length() * 100

    flowMaterial.uniforms.uMouseDirection.value
      .set(vRefs.velocity.x, vRefs.velocity.y)
      .normalize()
    flowMaterial.uniforms.uFrame.value = frameCount.current
    flowMaterial.uniforms.uTime.value = clock.getElapsedTime()

    raymarchMaterial.uniforms.uFlowSize.value = FLOW_SIM_SIZE / 2
    // Render flow sim
    gl.setRenderTarget(flowFbo.write)
    gl.render(flowScene, camera)
    gl.setRenderTarget(screenFbo)

    flowFbo.swap()

    gl.render(scene, camera)
    frameCount.current++
  }, 1)

  const flowScene = useMemo(() => new THREE.Scene(), [])

  useEffect(() => {
    sceneCamera.lookAt(0, 0, 0.5)
  }, [sceneCamera])

  const debugTextures = {
    flow: flowFbo.read.texture,
    flowWrite: flowFbo.write.texture,
    screen: screenFbo.texture
  }
  return (
    <>
      {createPortal(
        <mesh>
          <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
          <primitive object={flowMaterial} />
        </mesh>,
        flowScene
      )}
      {/* Pointer events */}
      <mesh
        rotation={[Math.PI / -2, 0, 0]}
        position={[0, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerOver={() => (vRefs.shouldReset = true)}
      >
        <planeGeometry args={[FLOW_SIM_SIZE, FLOW_SIM_SIZE]} />
        <meshBasicMaterial map={flowFbo.read.texture} />
      </mesh>

      <DebugTextures textures={debugTextures} />

      {/* Raymarched water */}
      <mesh rotation={[Math.PI / -2, 0, 0]} position={[0, 0.5, 0]}>
        <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
        <primitive object={raymarchMaterial} />
      </mesh>
      {/* @ts-expect-error: some type issue */}
      <PerspectiveCamera makeDefault position={[0, 1, 2]} />
      <OrbitControls />
    </>
  )
}

const PLANE_SIZE = 2
const FLOW_SIM_SIZE = 5
