import { useMemo } from "react"

import { createFlowMaterial } from "./materials/flow-material"
import { flowSize, SceneTargets } from "./use-targets"

export type SceneMaterials = ReturnType<typeof useMaterials>

export function useMaterials(targets: SceneTargets) {
  const materials = useMemo(() => {
    const flowMaterial = createFlowMaterial(
      targets.flowFbo.read.texture,
      flowSize
    )
    return {
      flowMaterial
    }
  }, [targets])

  return materials
}
