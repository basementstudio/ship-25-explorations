"use client"

import { useFBO } from "@react-three/drei"
import {
  createPortal,
  ThreeEvent,
  useFrame,
  useThree
} from "@react-three/fiber"
import { useCallback, useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import { Cameras } from "./cameras"
import { FLOW_SIM_SIZE, RAYMARCH_WATER_CENTER } from "./constants"
import { RAYMARCH_FLOW_SIZE } from "./constants"
import { DebugTextures } from "./debug-textures"
import { useAssets } from "./use-assets"
import { useMaterials } from "./use-materials"
import { useTargets } from "./use-targets"

export const hitConfig = {
  scale: 1
}

export function Scene() {
  const activeCamera = useThree((state) => state.camera)

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
  const materials = useMaterials(targets, assets)
  const { flowMaterial, raymarchMaterial, updateFlowCamera } = materials

  updateFlowCamera(activeCamera as THREE.PerspectiveCamera)

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (e.uv) {
        vRefs.uv.copy(e.uv)
      }
    },
    [vRefs]
  )

  const lerpMouse = useCallback(
    (delta: number) => {
      if (vRefs.shouldReset) {
        vRefs.smoothUv.copy(vRefs.uv)
        vRefs.prevSmoothUv.copy(vRefs.uv)
        vRefs.shouldReset = false
      }

      vRefs.prevSmoothUv.copy(vRefs.smoothUv)

      const l = Math.min(delta * 10, 1)
      vRefs.smoothUv.lerp(vRefs.uv, l)
      vRefs.velocity.subVectors(vRefs.smoothUv, vRefs.prevSmoothUv)
    },
    [vRefs]
  )

  const frameCount = useRef(0)

  const screenFbo = useFBO()

  useEffect(() => {
    // for dev reasons, reset frame count when material gets reloaded
    frameCount.current = 0
  }, [flowMaterial, flowFbo])

  const flowScene = useMemo(() => new THREE.Scene(), [])

  const renderFlow = useCallback(
    (
      gl: THREE.WebGLRenderer,
      camera: THREE.Camera,
      _scene: THREE.Scene,
      clock: THREE.Clock
    ) => {
      // Update uniforms
      flowMaterial.uniforms.uMouse.value.set(vRefs.smoothUv.x, vRefs.smoothUv.y)
      flowMaterial.uniforms.uFlowFeedBackTexture.value = flowFbo.read.texture
      flowMaterial.uniforms.uMouseVelocity.value = vRefs.velocity.length() * 100

      flowMaterial.uniforms.uMouseDirection.value
        .set(vRefs.velocity.x, vRefs.velocity.y)
        .normalize()
      flowMaterial.uniforms.uFrame.value = frameCount.current
      flowMaterial.uniforms.uTime.value = clock.getElapsedTime()

      // Render flow sim
      gl.setRenderTarget(flowFbo.write)
      gl.render(flowScene, camera)
      gl.setRenderTarget(screenFbo)
      flowFbo.swap()
    },
    [flowMaterial, flowFbo, vRefs, flowScene, screenFbo]
  )

  // Update flow simulation
  useFrame(({ gl, scene, clock }, delta) => {
    const shouldDoubleRender = delta > 1 / 75

    lerpMouse(shouldDoubleRender ? delta / 2 : delta)
    renderFlow(gl, activeCamera, scene, clock)

    if (shouldDoubleRender) {
      lerpMouse(delta / 2)
      renderFlow(gl, activeCamera, scene, clock)
    }

    raymarchMaterial.uniforms.uFlowSize.value = FLOW_SIM_SIZE / 2

    gl.render(scene, activeCamera)
    frameCount.current++
  }, 1)

  const debugTextures = {
    flow: flowFbo.read.texture,
    flowWrite: flowFbo.write.texture,
    screen: screenFbo.texture
  }
  return (
    <>
      {createPortal(
        <mesh>
          <planeGeometry args={[2, 2]} />
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
      <mesh
        rotation={[Math.PI / -2, 0, 0]}
        position={RAYMARCH_WATER_CENTER as any}
      >
        <planeGeometry args={[RAYMARCH_FLOW_SIZE * 2, RAYMARCH_FLOW_SIZE]} />
        <primitive object={raymarchMaterial} />
      </mesh>

      <Cameras />
    </>
  )
}
