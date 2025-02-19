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
  const { flowMaterial, flowNormalMaterial } = materials

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.uv) {
      vRefs.uv.copy(e.uv)
    }
  }, [])

  const updateFilter = useCallback((canvas: HTMLCanvasElement) => {
    const feImage = document.getElementById(
      "displacementMapImage"
    ) as any as SVGFEImageElement | null
    if (feImage) {
      feImage.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "href",
        canvas.toDataURL("image/png", 0.1)
      )
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

    const canvasContainer = document.getElementById(
      "displacementCanvasContainer"
    ) as HTMLDivElement | null
    if (canvasContainer) {
      const canvas = canvasContainer.querySelector(
        "canvas"
      ) as HTMLCanvasElement | null
      if (canvas) {
        updateFilter(canvas)
      }
    }
  }, 1)

  const flowScene = useMemo(() => new THREE.Scene(), [])

  const sceneCamera = useThree((state) => state.camera)

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
