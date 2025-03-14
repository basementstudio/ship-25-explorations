import { useMemo } from "react"
import * as THREE from "three"

import { useDoubleFBO } from "./use-double-fbo"

export const flowSize = 1024 * 2

export type SceneTargets = ReturnType<typeof useTargets>

export function useTargets() {
  const flowFbo = useDoubleFBO(flowSize, flowSize, {
    type: THREE.FloatType
    // minFilter: THREE.NearestFilter,
    // magFilter: THREE.NearestFilter
  })

  const orbeFlowFbo = useDoubleFBO(flowSize, flowSize, {
    type: THREE.FloatType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter
  })

  const targets = useMemo(() => {
    return {
      flowFbo,
      orbeFlowFbo
    }
  }, [flowFbo, orbeFlowFbo])

  return targets
}
