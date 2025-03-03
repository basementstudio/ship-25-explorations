"use client"

import {
  createPortal,
  ThreeEvent,
  useFrame,
  useThree
} from "@react-three/fiber"
import { useControls } from "leva"
import { useCallback, useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import { clamp, lerp, valueRemap } from "~/lib/utils/math"

import { Cameras } from "./cameras"
import { FLOW_SIM_SIZE } from "./constants"
import { DebugTextures } from "./debug-textures"
import { useAssets } from "./use-assets"
import { DoubleFBO } from "./use-double-fbo"
import { LerpedMouse, useLerpMouse } from "./use-lerp-mouse"
import { useMaterials } from "./use-materials"
import { useTargets } from "./use-targets"

export function Scene() {
  const activeCamera = useThree((state) => state.camera)

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
    ferroMeshMaterial
  } = materials

  updateFlowCamera(activeCamera as THREE.PerspectiveCamera)

  const [handlePointerMoveFloor, lerpMouseFloor, vRefsFloor] = useLerpMouse({
    intercept: (e) => {
      e.point.z *= 0.5
    }
  })

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

  const renderFlow = useCallback(
    (
      gl: THREE.WebGLRenderer,
      camera: THREE.Camera,
      scene: THREE.Scene,
      clock: THREE.Clock,
      material: THREE.RawShaderMaterial,
      fbo: DoubleFBO,
      lerpedMouse: LerpedMouse
    ) => {
      // Update uniforms
      material.uniforms.uMouse.value.set(
        lerpedMouse.smoothUv.x,
        lerpedMouse.smoothUv.y
      )
      material.uniforms.uFlowFeedBackTexture.value = fbo.read.texture
      material.uniforms.uMouseVelocity.value =
        lerpedMouse.velocity.length() * 100

      material.uniforms.uMouseDirection.value
        .set(lerpedMouse.velocity.x, lerpedMouse.velocity.y)
        .normalize()
      material.uniforms.uFrame.value = frameCount.current
      material.uniforms.uTime.value = clock.getElapsedTime()

      // Render flow sim
      gl.setRenderTarget(fbo.write)
      gl.render(scene, camera)
      gl.setRenderTarget(debugTextures ? screenFbo : null)
      fbo.swap()
    },
    [vRefsFloor, screenFbo, debugTextures]
  )

  const vActive = useRef(0)
  const vActiveFast = useRef(0)

  const getActive = () => {
    let a = vRefsFloor.point.distanceTo(new THREE.Vector3(0, 0, 0))
    a -= 0.2
    a = clamp(0, 1, a)
    return a
  }

  // Update flow simulation
  useFrame(({ gl, scene, clock }, delta) => {
    gl.setClearColor("#000")

    const shouldDoubleRender = delta > 1 / 75

    // floor
    lerpMouseFloor(shouldDoubleRender ? delta / 2 : delta)
    renderFlow(
      gl,
      activeCamera,
      flowScene,
      clock,
      flowMaterial,
      flowFbo,
      vRefsFloor
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
        vRefsFloor
      )
    }

    ferroMeshMaterial.uniforms.uMousePosition.value.lerp(
      vRefsFloor.point,
      3 * delta
    )

    const activeFactor = getActive()

    vActive.current = lerp(vActive.current, activeFactor, 6 * delta)

    vActiveFast.current = lerp(vActiveFast.current, activeFactor, 10 * delta)

    ferroMeshMaterial.uniforms.uDiskRadius.value = valueRemap(
      vActive.current,
      0,
      1,
      0.35,
      0.5
    )

    ferroMeshMaterial.uniforms.uHeightMax.value = valueRemap(
      vActive.current,
      0,
      1,
      0.3,
      0.05
    )

    ferroMeshMaterial.uniforms.uHeightMin.value = valueRemap(
      vActive.current,
      0,
      1,
      0.15,
      0
    )

    ferroMeshMaterial.uniforms.uMainPyramidRadius.value = valueRemap(
      vActiveFast.current,
      0,
      1,
      0.45,
      0.4
    )

    ferroMeshMaterial.uniforms.uMainPyramidHeight.value = valueRemap(
      vActiveFast.current,
      0,
      1,
      0.6,
      0.5
    )

    ferroMeshMaterial.uniforms.uTime.value = clock.getElapsedTime()

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
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          handlePointerMoveFloor(e)
        }}
      >
        <planeGeometry args={[FLOW_SIM_SIZE, FLOW_SIM_SIZE]} />
        <meshBasicMaterial map={flowFbo.read.texture} />
      </mesh>
      <mesh
        visible={debugFloor}
        rotation={[0, 0, 0]}
        position={[0, 0, 0]}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          handlePointerMoveFloor(e)
        }}
      >
        <planeGeometry args={[FLOW_SIM_SIZE, FLOW_SIM_SIZE]} />
        <meshBasicMaterial map={flowFbo.read.texture} />
      </mesh>

      {/* Ferro mesh */}
      <mesh
        rotation={[Math.PI / -2, 0, 0]}
        position={[0, 0, 0]}
        scale={[2, 2, 2]}
      >
        <planeGeometry args={[2, 2, 300, 300]} />
        <primitive object={ferroMeshMaterial} />
      </mesh>

      <Cameras />

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
