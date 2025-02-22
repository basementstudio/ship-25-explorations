import { createPortal, useFrame, useThree } from "@react-three/fiber"
import { folder as levaFolder, useControls } from "leva"
import { useCallback, useMemo } from "react"
import { Group, OrthographicCamera, Texture } from "three"

import { hitConfig } from "./"
import { getMapDebugProgram } from "./materials/map-debug-program"

export interface DebugTexturesProps {
  textures: Record<string, Texture>
  defaultTexture?: string
}

export function DebugTextures({
  textures,
  defaultTexture = "screen"
}: DebugTexturesProps) {
  const gl = useThree((state) => state.gl)
  const camera = useMemo(() => new OrthographicCamera(), [])
  const numTextures = Object.keys(textures).length

  const debugTextureProgram = useMemo(() => getMapDebugProgram(), [])

  const grid = useMemo(() => {
    const sqrt = Math.sqrt(numTextures)
    const columns = Math.ceil(sqrt)
    const rows = Math.ceil(sqrt)
    const total = columns * rows

    return {
      columns,
      rows,
      total
    }
  }, [numTextures])

  const debugScene = useMemo(() => new Group(), [])

  const { debugTarget } = useControls({
    Interaction: levaFolder({
      debugTarget: {
        value:
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("debugTarget") ||
              defaultTexture
            : defaultTexture,
        options: Object.keys(textures).concat("all"),
        onChange: (value) => {
          if (typeof window !== "undefined") {
            window.history.pushState(
              {},
              "",
              window.location.pathname + "?debugTarget=" + value
            )
          }
        },
        transient: false
      }
    })
  })

  const size = useThree((state) => state.size)

  const DEFAULT_SCISSOR = {
    x: 0,
    y: 0,
    width: size.width,
    height: size.height
  }

  const saveGlState = useCallback(() => {
    const prevTarget = gl.getRenderTarget()
    const prevAutoClear = gl.autoClear
    return () => {
      gl.setRenderTarget(prevTarget)
      gl.autoClear = prevAutoClear
    }
  }, [gl])

  useFrame(() => {
    const resetGl = saveGlState()

    gl.autoClear = false
    gl.setRenderTarget(null)

    // gl.clear("#000", )

    gl.setViewport(
      DEFAULT_SCISSOR.x,
      DEFAULT_SCISSOR.y,
      DEFAULT_SCISSOR.width,
      DEFAULT_SCISSOR.height
    )

    gl.setScissor(
      DEFAULT_SCISSOR.x,
      DEFAULT_SCISSOR.y,
      DEFAULT_SCISSOR.width,
      DEFAULT_SCISSOR.height
    )

    const width = size.width
    const height = size.height

    const { columns, rows } = grid

    if (debugTarget !== "all" && debugTarget in textures) {
      hitConfig.scale = 1
      debugTextureProgram.uniforms.uMap.value = textures[debugTarget]
      gl.render(debugScene, camera)
      resetGl()
      return
    }

    hitConfig.scale = columns

    for (let i = 0; i < numTextures; i++) {
      const col = i % columns
      const row = rows - Math.floor(i / columns) - 1

      const w = width / columns
      const h = height / rows
      const x = col * w
      const y = row * h

      // console.log(w, h, x, y)

      gl.setViewport(x, y, w, h)
      // gl.setScissor(x, y, w, h)

      debugTextureProgram.uniforms.uMap.value =
        textures[Object.keys(textures)[i]]

      gl.render(debugScene, camera)
    }

    // reset

    gl.setViewport(
      DEFAULT_SCISSOR.x,
      DEFAULT_SCISSOR.y,
      DEFAULT_SCISSOR.width,
      DEFAULT_SCISSOR.height
    )

    gl.setScissor(
      DEFAULT_SCISSOR.x,
      DEFAULT_SCISSOR.y,
      DEFAULT_SCISSOR.width,
      DEFAULT_SCISSOR.height
    )
    resetGl()
  })

  return (
    <>
      {createPortal(
        <mesh>
          <planeGeometry args={[2, 2]} />
          <primitive object={debugTextureProgram} />
        </mesh>,
        debugScene
      )}
    </>
  )
}
