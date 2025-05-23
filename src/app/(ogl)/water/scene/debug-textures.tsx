import { folder as levaFolder, useControls } from "leva"
import { Camera, Texture, Transform } from "ogl"
import { useMemo } from "react"
import { createPortal, useFrame, useOGL } from "react-ogl"

import { DEFAULT_SCISSOR } from "~/gl"
import { QuadGeometry } from "~/gl/components/quad"

import { getMapDebugProgram } from "../programs/map-debug-program"
import { hitConfig } from "./use-hit"

export interface DebugTexturesProps {
  textures: Record<string, Texture>
  defaultTexture?: string
}

export function DebugTextures({
  textures,
  defaultTexture = "screen"
}: DebugTexturesProps) {
  const gl = useOGL((state) => state.gl)
  const camera = useMemo(() => new Camera(gl), [gl])
  const numTextures = Object.keys(textures).length

  const debugTextureProgram = useMemo(() => getMapDebugProgram(gl), [gl])

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

  const debugScene = useMemo(() => new Transform(), [])

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

  useFrame(({ renderer }) => {
    gl.viewport(
      DEFAULT_SCISSOR.x,
      DEFAULT_SCISSOR.y,
      DEFAULT_SCISSOR.width,
      DEFAULT_SCISSOR.height
    )

    gl.scissor(
      DEFAULT_SCISSOR.x,
      DEFAULT_SCISSOR.y,
      DEFAULT_SCISSOR.width,
      DEFAULT_SCISSOR.height
    )

    const width = DEFAULT_SCISSOR.width
    const height = DEFAULT_SCISSOR.height

    const { columns, rows } = grid

    if (debugTarget !== "all" && debugTarget in textures) {
      hitConfig.scale = 1
      debugTextureProgram.uniforms.uMap.value = textures[debugTarget]
      renderer.render({
        scene: debugScene,
        camera: camera
      })

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

      gl.viewport(x, y, w, h)
      gl.scissor(x, y, w, h)

      debugTextureProgram.uniforms.uMap.value =
        textures[Object.keys(textures)[i]]
      renderer.render({
        scene: debugScene,
        camera: camera,
        frustumCull: false
      })
    }

    // reset

    gl.viewport(
      DEFAULT_SCISSOR.x,
      DEFAULT_SCISSOR.y,
      DEFAULT_SCISSOR.width,
      DEFAULT_SCISSOR.height
    )

    gl.scissor(
      DEFAULT_SCISSOR.x,
      DEFAULT_SCISSOR.y,
      DEFAULT_SCISSOR.width,
      DEFAULT_SCISSOR.height
    )
  })

  return (
    <>
      {createPortal(
        <mesh>
          <QuadGeometry />
          <primitive object={debugTextureProgram} />
        </mesh>,
        debugScene
      )}
    </>
  )
}
