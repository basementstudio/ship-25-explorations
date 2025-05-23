import { OGLRenderingContext, RenderTarget } from "ogl"
import { useMemo } from "react"

export type ProgramTargets = ReturnType<typeof useTargets>

export const flowSize = 2 * 2 * 2 * 2 * 2 * 2 * 2 * 2 * 2

export function useTargets(gl: OGLRenderingContext) {
  const raymarchTarget = useMemo(() => {
    const target = new RenderTarget(gl, {
      color: 2,
      width: 1024,
      height: 1024
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

  const flowTargetA = useMemo(() => {
    const target = new RenderTarget(gl, {
      width: flowSize,
      height: flowSize,
      // type: gl.FLOAT, // FLOAT_TYPE
      // internalFormat: 0x8815, // RGB32F
      // format: 0x1907, // RGB_FORMAT,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      magFilter: gl.LINEAR
    })
    return target
  }, [gl])

  const flowTargetB = useMemo(() => {
    const target = new RenderTarget(gl, {
      width: flowSize,
      height: flowSize,
      // type: gl.FLOAT, // FLOAT_TYPE
      // internalFormat: 0x8815, // RGB32F
      // format: 0x1907, // RGB_FORMAT,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      magFilter: gl.LINEAR
    })
    return target
  }, [gl])

  const targets = useMemo(() => {
    return {
      raymarchTarget,
      finalPassTarget,
      flowTargetA,
      flowTargetB
    }
  }, [raymarchTarget, finalPassTarget, flowTargetB, flowTargetA])

  return targets
}
