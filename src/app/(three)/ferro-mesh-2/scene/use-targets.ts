import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import { useDoubleFBO } from "./use-double-fbo"
import { useThree } from "@react-three/fiber"

export const flowSize = 1024

export type SceneTargets = ReturnType<typeof useTargets>

export function useTargets() {
  const flowFbo = useDoubleFBO(flowSize, flowSize, {
    type: THREE.FloatType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter
  })

  const orbeFlowFbo = useDoubleFBO(flowSize, flowSize, {
    type: THREE.FloatType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter
  })

  const rendererWidth = useThree((state) => state.size.width)
  const rendererHeight = useThree((state) => state.size.height)

  const sizeRef = useRef({
    width: rendererWidth,
    height: rendererHeight
  })

  const targets = useMemo(() => {

    const baseRenderFbo = new THREE.WebGLRenderTarget(sizeRef.current.width, sizeRef.current.height, {
      type: THREE.FloatType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      generateMipmaps: false
    })

    return {
      flowFbo,
      orbeFlowFbo,
      baseRenderFbo
    }
  }, [flowFbo, orbeFlowFbo])

  useEffect(() => {
    targets.baseRenderFbo.setSize(rendererWidth, rendererHeight)
  }, [rendererWidth, rendererHeight, targets.baseRenderFbo])

  return targets
}
