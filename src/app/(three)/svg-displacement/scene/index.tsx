"use client"

import { createPortal, useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import { useMaterials } from "./use-materials"
import { useTargets } from "./use-targets"
export function Scene() {
  const { size } = useThree()
  const mouseRef = useRef({ x: 0, y: 0, velocity: 0 })
  const prevMouseRef = useRef({ x: 0, y: 0 })

  const targets = useTargets()
  const { flowFbo } = targets
  const materials = useMaterials(targets)
  const { flowMaterial } = materials

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = event.clientX / size.width
      const y = 1 - event.clientY / size.height

      const dx = x - prevMouseRef.current.x
      const dy = y - prevMouseRef.current.y
      const velocity = Math.sqrt(dx * dx + dy * dy)

      mouseRef.current = { x, y, velocity }
      prevMouseRef.current = { x, y }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [size])

  // Update flow simulation
  useFrame(({ gl, camera, clock }, delta, frame) => {
    // Update uniforms
    flowMaterial.uniforms.uMouse.value.set(
      mouseRef.current.x,
      mouseRef.current.y
    )
    flowMaterial.uniforms.uFlowFeedBackTexture.value = flowFbo.read.texture
    flowMaterial.uniforms.uMouseVelocity.value = mouseRef.current.velocity
    flowMaterial.uniforms.uFrame.value = frame
    flowMaterial.uniforms.uTime.value = clock.getElapsedTime()

    // Render flow sim
    gl.setRenderTarget(flowFbo.write)
    gl.render(flowScene, camera)
    gl.setRenderTarget(null)

    // Render to next target
    // renderCopy.copy(flowTargets[1].texture, flowTargets[0])

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
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial map={flowFbo.read.texture} />
      </mesh>
      <mesh position={[0, 2, 0.01]}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial map={flowFbo.write.texture} />
      </mesh>
    </>
  )
}
