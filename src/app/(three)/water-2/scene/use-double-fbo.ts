import { useEffect, useMemo } from "react"
import * as THREE from "three"
import { RenderTargetOptions } from "three"

type FBO = {
  read: THREE.WebGLRenderTarget
  write: THREE.WebGLRenderTarget
  swap: () => void
  dispose: () => void
}

export const useDoubleFBO = (
  width: number,
  height: number,
  options: RenderTargetOptions
) => {
  const read = useMemo(() => {
    const fbo = new THREE.WebGLRenderTarget(width, height, options)
    return fbo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const write = useMemo(() => {
    const fbo = new THREE.WebGLRenderTarget(width, height, options)
    return fbo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    read.setSize(width, height)
    write.setSize(width, height)
  }, [width, height, read, write])

  useEffect(() => {
    // dispose on unmount
    return () => {
      read.dispose()
      write.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fbo = useMemo<FBO>(
    () => ({
      read,
      write,
      swap: () => {
        const temp = fbo.read
        fbo.read = fbo.write
        fbo.write = temp
      },
      dispose: () => {
        read.dispose()
        write.dispose()
      }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return fbo
}
