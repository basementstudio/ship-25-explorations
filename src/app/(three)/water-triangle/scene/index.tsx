"use client"

import { createPortal, useFrame, useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"

import { Cameras, useCameraStore } from "./cameras"
import { FLOW_SIM_SIZE, RAYMARCH_WATER_CENTER } from "./constants"
import { RAYMARCH_FLOW_SIZE } from "./constants"
import { DebugTextures } from "./debug-textures"
import { Env } from "./env"
import { renderFlow } from "./render-flow"
import { useAssets } from "./use-assets"
import { useLerpMouse } from "./use-lerp-mouse"
import { useMaterials } from "./use-materials"
import { useTargets } from "./use-targets"

export function Scene() {
  const activeCamera = useCameraStore((state) => state.camera)

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

  const mainScene = useMemo(() => new THREE.Scene(), [])

  const [envMap, setEnvMap] = useState<THREE.Texture | null>(null)

  // update environment
  useFrame(({ scene }) => {
    const env = scene.environment
    if (!env) return
    const currentEnv = raymarchMaterial.uniforms.envMap.value
    if (currentEnv !== env) {
      raymarchMaterial.uniforms.envMap.value = env
      const rotation = raymarchMaterial.uniforms.envMapRotation
        .value as THREE.Matrix3

      const _e1 = /*@__PURE__*/ new THREE.Euler()
      const _m1 = /*@__PURE__*/ new THREE.Matrix4()

      _e1.copy(scene.environmentRotation)

      // accommodate left-handed frame
      _e1.x *= -1
      _e1.y *= -1
      _e1.z *= -1

      _e1.y *= -1
      _e1.z *= -1

      rotation.setFromMatrix4(_m1.makeRotationFromEuler(_e1))

      setEnvMap(env)

      console.log(raymarchMaterial.uniforms.envMap)
    }
  })

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

      <mesh position={[0, -0.4, 0]} scale={[0.44, 1, 0.44]}>
        <primitive object={assets.pyramid.geometry} />
        <meshStandardMaterial
          color="black"
          metalness={1}
          roughness={0.2}
          envMap={envMap}
        />
      </mesh>

      <pointLight decay={0.1} intensity={200} position={[-2, 0.5, -1.7]} />
      <pointLight decay={0.1} intensity={200} position={[2, 0.5, -1.7]} />
      <pointLight decay={0.1} intensity={200} position={[0, 0.5, 2]} />

      <Cameras />
      <Env />

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
