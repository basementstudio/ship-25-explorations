import { OGLRenderingContext, RenderTarget } from "ogl"
import { useMemo } from "react"
import { useOGL } from "react-ogl"

export type ProgramTargets = ReturnType<typeof useTargets>

export function useTargets(gl: OGLRenderingContext) {

  const insideTarget = useMemo(() => {
    const target = new RenderTarget(gl, {
      color: 2,
      width: 1024,
      height: 1024
    })
    return target
  }, [gl])

  const raymarchTarget = useMemo(() => {
    const target = new RenderTarget(gl, {
      color: 2,
      width: 1024,
      height: 1024,
    })

    return target
  }, [gl])

  const outsideTarget = useMemo(() => {
    const target = new RenderTarget(gl, {
      color: 2,
      width: 1024,
      height: 1024,
    })
    return target
  }, [gl])

  const finalPassTarget = useMemo(() => {
    const target = new RenderTarget(gl, {
      width: 1024,
      height: 1024
    })
    return target
  }, [gl])

  // const fluidTarget = useMemo(() => {
  //   const target = new RenderTarget(gl, {
  //     width: 64,
  //     height: 64,
  //     type: gl.FLOAT, // FLOAT_TYPE
  //     internalFormat: 0x822E, // R32F
  //     format: 0x1903 // RED_FORMAT
  //   })
  //   return target
  // }, [gl])

  const targets = useMemo(() => {
    return {
      insideTarget,
      raymarchTarget,
      outsideTarget,
      finalPassTarget
    }
  }, [insideTarget, raymarchTarget, outsideTarget, finalPassTarget])

  return targets
}