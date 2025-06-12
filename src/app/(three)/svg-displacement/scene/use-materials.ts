import { useMemo } from "react"

import { createFlowMaterial } from "./materials/flow-material"
import { flowSize, SceneTargets } from "./use-targets"
import { createFlowNormalMaterial } from "./materials/flow-normal-material"

export type SceneMaterials = ReturnType<typeof useMaterials>

export function useMaterials(targets: SceneTargets) {
  const materials = useMemo(() => {
    const flowMaterial = createFlowMaterial(
      targets.flowFbo.read.texture,
      flowSize
    )

    const flowNormalMaterial = createFlowNormalMaterial()
    flowNormalMaterial.uniforms.uHeightmap.value = targets.flowFbo.read.texture

    return {
      flowMaterial,
      flowNormalMaterial,
    }
  }, [targets])

  return materials
}
