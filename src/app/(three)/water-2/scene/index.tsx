"use client"

import { createPortal, useFrame, useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import { Cameras } from "./cameras"
import { FLOW_SIM_SIZE, RAYMARCH_WATER_CENTER } from "./constants"
import { RAYMARCH_FLOW_SIZE } from "./constants"
import { DebugTextures } from "./debug-textures"
import { Orbe } from "./orbe"
import { renderFlow } from "./render-flow"
import { useAssets } from "./use-assets"
import { useLerpMouse } from "./use-lerp-mouse"
import { useMaterials } from "./use-materials"
import { useTargets } from "./use-targets"

export function Scene() {
  const activeCamera = useThree((state) => state.camera)

  const [{ debugFloor, renderFloor, debugTextures }] = useControls(() => ({
    debugTextures: false,
    debugFloor: false,
    renderFloor: true
  }))

  const targets = useTargets()
  const { flowFbo, orbeFlowFbo } = targets
  const assets = useAssets()
  const materials = useMaterials(targets, assets)
  const { flowMaterial, raymarchMaterial, updateFlowCamera } = materials

  updateFlowCamera(activeCamera as THREE.PerspectiveCamera)

  const [handlePointerMoveFloor, lerpMouseFloor, vRefsFloor] = useLerpMouse()

  const frameCount = useRef(0)

  const screenFbo = useMemo(() => {
    const fbo = new THREE.WebGLRenderTarget(10, 10, {
      depthBuffer: true,
      depthTexture: new THREE.DepthTexture(10, 10)
    })

    if (typeof window !== "undefined") {
      fbo.setSize(window.innerWidth, window.innerHeight)
    }

    return fbo
  }, [])

  const size = useThree((state) => state.size)

  useEffect(() => {
    screenFbo.setSize(size.width, size.height)
  }, [size])

  useEffect(() => {
    // for dev reasons, reset frame count when material gets reloaded
    frameCount.current = 0
  }, [flowMaterial, flowFbo])

  const flowScene = useMemo(() => new THREE.Scene(), [])

  // Update flow simulation
  useFrame(({ gl, scene, clock }, delta) => {
    const shouldDoubleRender = delta > 1 / 75

    gl.setRenderTarget(debugTextures ? screenFbo : null)

    // floor
    lerpMouseFloor(shouldDoubleRender ? delta / 2 : delta)
    renderFlow(
      gl,
      activeCamera,
      flowScene,
      clock,
      flowMaterial,
      flowFbo,
      vRefsFloor,
      frameCount.current
    )

    if (shouldDoubleRender) {
      // floor
      lerpMouseFloor(delta / 2)
      renderFlow(
        gl,
        activeCamera,
        flowScene,
        clock,
        flowMaterial,
        flowFbo,
        vRefsFloor,
        frameCount.current
      )
    }

    raymarchMaterial.uniforms.uFlowSize.value = FLOW_SIM_SIZE / 2

    gl.render(scene, activeCamera)
    frameCount.current++
  }, 1)

  return (
    <>
      {/* Flow simulation (floor) */}
      {createPortal(
        <mesh>
          {/* Has to be 2x2 to fill the screen using pos attr */}
          <planeGeometry args={[2, 2]} />
          <primitive object={flowMaterial} />
        </mesh>,
        flowScene
      )}

      {/* Pointer events (floor) */}
      <mesh
        visible={debugFloor}
        rotation={[Math.PI / -2, 0, 0]}
        position={[0, 0, 0]}
        onPointerMove={handlePointerMoveFloor}
        onPointerOver={() => (vRefsFloor.shouldReset = true)}
      >
        <planeGeometry args={[FLOW_SIM_SIZE, FLOW_SIM_SIZE]} />
        <meshBasicMaterial map={flowFbo.read.texture} />
      </mesh>

      {/* Raymarched water (floor) */}
      <mesh
        rotation={[Math.PI / -2, 0, 0]}
        visible={renderFloor}
        position={RAYMARCH_WATER_CENTER as any}
      >
        <planeGeometry args={[RAYMARCH_FLOW_SIZE * 2, RAYMARCH_FLOW_SIZE]} />
        <primitive object={raymarchMaterial} />
      </mesh>

      <Cameras />

      <Orbe
        materials={materials}
        assets={assets}
        targets={targets}
        activeCamera={activeCamera}
        frameCount={frameCount}
      />

      {/* Display textures */}
      {debugTextures && (
        <DebugTextures
          textures={{
            flow: flowFbo.read.texture,
            pyramidFlow: orbeFlowFbo.read.texture,
            screen: screenFbo.texture,
            screenDepth: screenFbo.depthTexture!
          }}
        />
      )}
    </>
  )
}
