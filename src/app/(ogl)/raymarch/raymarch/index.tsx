"use client"

import { folder as levaFolder, useControls } from "leva"
import { Color, Program, TextureLoader, Vec2 } from "ogl"
import { useEffect, useRef } from "react"
import { useFrame, useLoader, useOGL } from "react-ogl"

import { QuadGeometry } from "~/gl/components/quad"
import { lerp } from "~/lib/utils/math"

import MAIN_FRAGMENT from "./main.frag"
import MAIN_VERTEX from "./main.vert"

export function BackgroundGradient() {
  const vRefs = useRef({
    resolution: new Vec2(1, 1),
    mousePos: new Vec2(0, 0),
    animatedMousePos: new Vec2(0, 0)
  })

  const matcap = useLoader(TextureLoader, "/textures/matcap-1.png")
  const reflection = useLoader(
    TextureLoader,
    "/textures/studio_small_02_1k.png"
  )

  const defaultColor = "#3b3b3b"

  const uniformsRef = useRef({
    mainColor: { value: new Color(defaultColor) },
    cPos: { value: [0, 0, 4] },
    cameraQuaternion: { value: [0, 0, 0, 1] },
    fov: { value: 45 },
    matcapMap: { value: matcap },
    reflectionMap: { value: reflection },
    resolution: { value: vRefs.current.resolution },
    mousePos: { value: vRefs.current.animatedMousePos },
    reflectionIntensity: { value: 1 },
    uTime: { value: 0 }
  } satisfies Record<string, any>)

  useControls(() => ({
    Raymarch: levaFolder(
      {
        mainColor: {
          value: defaultColor,
          onChange: (value) => {
            uniformsRef.current.mainColor.value.set(value)
          }
        },
        reflectionIntensity: {
          value: 1,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (value) => {
            uniformsRef.current.reflectionIntensity.value = value
          }
        }
      },
      {
        collapsed: false
      }
    )
  }))

  const programRef = useRef<Program>(null)

  const canvas = useOGL((state) => state.gl.canvas)

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

  // set scene camera
  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    import("~/gl/hooks/use-gl-controls").then((mod) => {
      if (signal.aborted) return
      mod.useGlControls.setState({ activeCamera: "main" })
    })

    return () => controller.abort()
  }, [])

  useFrame((state, time) => {
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

    if (programRef.current) {
      programRef.current.uniforms.uTime.value = time * 0.0005
    }
  })

  return (
    <mesh>
      <QuadGeometry />
      <program
        ref={programRef}
        vertex={MAIN_VERTEX}
        fragment={MAIN_FRAGMENT}
        uniforms={uniformsRef.current}
      />
    </mesh>
  )
}
