import { Camera, Texture, Transform } from "ogl"
import { useMemo } from "react"
import { createPortal, useFrame, useOGL } from "react-ogl"

import { DEFAULT_SCISSOR } from "~/gl"
import { QuadGeometry } from "~/gl/components/quad"

import { getMapDebugProgram } from "../programs/map-debug-program"

export interface DebugTexturesProps {
  textures: Texture[]
  fullScreen?: number
}

export function DebugTextures({ textures, fullScreen }: DebugTexturesProps) {
  const canvas = useOGL((state) => state.gl.canvas as HTMLCanvasElement)
  const gl = useOGL((state) => state.gl)
  const camera = useMemo(() => new Camera(gl), [gl])

  const debugTextureProgram = useMemo(() => getMapDebugProgram(gl), [gl])

  const grid = useMemo(() => {
    const sqrt = Math.sqrt(textures.length)
    const columns = Math.ceil(sqrt)
    const rows = Math.ceil(sqrt)
    const total = columns * rows

    return {
      columns,
      rows,
      total
    }
  }, [textures.length])

  const debugScene = useMemo(() => new Transform(), [])

  useFrame(({ renderer }) => {
    gl.clearColor(0, 0, 0, 1)

    camera.updateMatrixWorld()
    camera.updateProjectionMatrix()
    camera.updateMatrix()

    const width = canvas.width
    const height = canvas.height

    const { columns, rows } = grid

    if (typeof fullScreen === "number") {
      debugTextureProgram.uniforms.uMap.value = textures[fullScreen]

      renderer.render({
        scene: debugScene,
        camera: camera
      })

      return
    }

    for (let i = 0; i < textures.length; i++) {
      const col = i % columns
      const row = rows - Math.floor(i / columns) - 1

      debugTextureProgram.uniforms.uMap.value = textures[i]

      const w = width / columns
      const h = height / rows
      const x = col * w
      const y = row * h

      gl.scissor(x, y, w, h)
      gl.viewport(x, y, w, h)

      renderer.render({
        scene: debugScene,
        camera: camera
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
