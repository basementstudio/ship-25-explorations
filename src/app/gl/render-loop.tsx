import { useEffect, useMemo, useRef } from "react"
import { useFrame, useOGL } from "react-ogl"

import { DEFAULT_SCISSOR } from "~/gl"
import { useGlControls } from "~/gl/hooks/use-gl-controls"

import { orbitCamera } from "./components/devex/orbit"

export const RenderLoop = () => {
  const setOGL = useOGL((s) => s.set)
  const scene = useOGL((s) => s.scene)
  const renderer = useOGL((s) => s.renderer)

  const activeCamera = useGlControls((s) => s.activeCamera)
  const hasRenderedRef = useRef(false)
  const setHasRendered = useGlControls((s) => s.setHasRendered)
  const glBackground = useGlControls((s) => s.glBackground)

  const mainCamera = useOGL((s) => s.camera)

  const cameraToRender = useMemo(() => {
    if (activeCamera === "debug-orbit") {
      return orbitCamera
    } else if (activeCamera === "main") {
      return mainCamera
    }

    return null
  }, [activeCamera, mainCamera])

  useEffect(() => {
    // disable default render loop
    setOGL(() => ({
      priority: 1
    }))
    return () => {
      setOGL(() => ({
        priority: 0
      }))
    }
  }, [setOGL])

  useFrame(() => {
    // User is rendering its own camera.
    if (!cameraToRender) return

    renderer.gl.scissor(
      DEFAULT_SCISSOR.x,
      DEFAULT_SCISSOR.y,
      DEFAULT_SCISSOR.width,
      DEFAULT_SCISSOR.height
    )

    /* Set clear color */
    renderer.gl.clearColor(glBackground.r, glBackground.g, glBackground.b, 1)

    renderer.render({
      scene,
      camera: cameraToRender
    })

    if (!hasRenderedRef.current) {
      setHasRendered()
      hasRenderedRef.current = true
    }
  })

  return <></>
}
