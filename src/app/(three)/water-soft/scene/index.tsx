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

  const [{ debugFloor, debugTextures }] = useControls(() => ({
    debugTextures: false,
    debugFloor: false,
    renderFloor: true
  }))

  const targets = useTargets()
  const { flowFbo, orbeFlowFbo } = targets
  const assets = useAssets()
  const materials = useMaterials(targets, assets)
  const {
    flowMaterial,
    raymarchMaterial,
    updateFlowCamera,
    flowSurfaceMaterial
  } = materials

  updateFlowCamera(activeCamera as THREE.PerspectiveCamera)

  const [envMap, setEnvMap] = useState<THREE.Texture | null>(null)

  // update environment
  useFrame(({ scene }) => {
    // return null //todo update env
    const env = scene.environment
    if (!env) return
    const currentEnv = flowSurfaceMaterial.uniforms.envMap.value
    if (currentEnv !== env) {
      flowSurfaceMaterial.uniforms.envMap.value = env
      const rotation = flowSurfaceMaterial.uniforms.envMapRotation
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

  const currentFrame = useRef(0)

  // Update flow simulation
  useFrame(({ gl, scene, clock }, delta) => {
    currentFrame.current++

    const oneEveryNFrames = currentFrame.current % 180 === 0
    const s = oneEveryNFrames ? 1 : 0

    // const t = clock.getElapsedTime()

    // let s = Math.sin(t * 1) - 0.2
    // // s = Math.max(s, 0)

    // if (s < 0) {
    //   s = 0
    // } else {
    //   s = 1
    // }

    let triangleHeight = s

    flowMaterial.uniforms.uTriangleHeight.value = triangleHeight

    // if (geoTryRef.current) {
    //   geoTryRef.current.scale.y = (triangleHeight - 0.5) * 3
    // }

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

  const geoTryRef = useRef<THREE.Mesh>(null)

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

      <mesh ref={geoTryRef} position={[0, -0.4, 0]} scale={[0.44, 1, 0.44]}>
        <primitive object={assets.pyramid.geometry} />
        <meshStandardMaterial color="black" metalness={1} />
      </mesh>

      {/* <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshMatcapMaterial matcap={assets.matcap} />
        <planeGeometry args={[10, 10]} />
      </mesh> */}

      {/* <pointLight decay={2} intensity={200} position={[-8, 0.5, -1.7]} />
      <pointLight decay={2} intensity={200} position={[2, 0.5, -1.7]} />
      <pointLight decay={2} intensity={200} position={[0, 0.5, 2]} /> */}

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[FLOW_SIM_SIZE, FLOW_SIM_SIZE]} />
        <primitive object={flowSurfaceMaterial} />
      </mesh>

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
