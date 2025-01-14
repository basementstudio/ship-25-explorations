"use client"

import { folder as levaFolder, useControls } from "leva"
import { TextureLoader, Vec2 } from "ogl"
import { useEffect, useRef } from "react"
import { useFrame, useLoader, useOGL } from "react-ogl"

import { QuadGeometry } from "~/gl/components/quad"
import { lerp } from "~/lib/utils/math"

import MAIN_FRAGMENT from "./main.frag"
import MAIN_VERTEX from "./main.vert"

export function BackgroundGradient() {
  const [uniforms] = useControls(() => ({
    Raymarch: levaFolder(
      {
        mainColor: "#3b3b3b"
      },
      {
        collapsed: false
      }
    )
  }))

  const hdriMap = useLoader(TextureLoader, "/textures/studio_small_02_1k.png")
  const canvas = useOGL((state) => state.gl.canvas)

  const vRefs = useRef({
    resolution: new Vec2(1, 1),
    mousePos: new Vec2(0, 0),
    animatedMousePos: new Vec2(0, 0)
  })

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    function handleScreenResize() {
      const { width, height } = canvas
      vRefs.current.resolution.x = width
      vRefs.current.resolution.y = height
    }

    handleScreenResize()
    window.addEventListener("resize", handleScreenResize)

    function handleMouseMove(event: MouseEvent) {
      const x = event.clientX / vRefs.current.resolution.x
      const y = 1 - event.clientY / vRefs.current.resolution.y

      vRefs.current.mousePos.x = x
      vRefs.current.mousePos.y = y
    }

    window.addEventListener("mousemove", handleMouseMove, { signal })

    return () => controller.abort()
  }, [canvas])

  useFrame(() => {
    vRefs.current.animatedMousePos.x = lerp(
      vRefs.current.animatedMousePos.x,
      vRefs.current.mousePos.x,
      0.1
    )
    vRefs.current.animatedMousePos.y = lerp(
      vRefs.current.animatedMousePos.y,
      vRefs.current.mousePos.y,
      0.1
    )
  })

  return (
    <mesh>
      <QuadGeometry />
      <program
        vertex={MAIN_VERTEX}
        fragment={MAIN_FRAGMENT}
        uniforms={{
          mainColor: uniforms.mainColor,
          cPos: [0, 0, 4],
          cameraQuaternion: [0, 0, 0, 1],
          fov: 45,
          hdriMap,
          resolution: vRefs.current.resolution,
          mousePos: vRefs.current.animatedMousePos
        }}
      />
    </mesh>
  )
}
