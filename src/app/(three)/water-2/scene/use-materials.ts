import { useMemo } from "react"

import { createFlowMaterial } from "./materials/flow-material"
import { flowSize, SceneTargets } from "./use-targets"
import { createFlowNormalMaterial } from "./materials/flow-normal-material"
import { getMapDebugProgram } from "./materials/map-debug-program"
import { getRaymarchProgram } from "./materials/raymarch-program"
import { PerspectiveCamera, Vector2, Vector3 } from "three"
import type { Assets } from "./use-assets"
import { useThree } from "@react-three/fiber"

export type SceneMaterials = ReturnType<typeof useMaterials>

export function useMaterials(targets: SceneTargets, assets: Assets, camera: PerspectiveCamera) {
  const size = useThree((state) => state.size)
  const materials = useMemo(() => {
    const flowMaterial = createFlowMaterial(
      targets.flowFbo.read.texture,
      flowSize
    )

    const flowNormalMaterial = createFlowNormalMaterial()
    flowNormalMaterial.uniforms.uHeightmap.value = targets.flowFbo.read.texture

    const mapDebugProgram = getMapDebugProgram()

    const raymarchProgram = getRaymarchProgram()
    raymarchProgram.uniforms.time = { value: 0.0 }
    raymarchProgram.uniforms.uNear = { value: camera.near }
    raymarchProgram.uniforms.uFar = { value: camera.far }
    raymarchProgram.uniforms.uHitPosition = { value: new Vector3() }
    raymarchProgram.uniforms.noiseScale = { value: 5.0 }
    raymarchProgram.uniforms.noiseLength = { value: 0.4 }
    raymarchProgram.uniforms.uFlowTexture = { value: targets.flowFbo.read.texture }
    raymarchProgram.uniforms.fov = { value: camera.fov }
    raymarchProgram.uniforms.cameraQuaternion = { value: camera.quaternion }
    raymarchProgram.uniforms.resolution = {
      value: new Vector2(size.width, size.height)
    }
    raymarchProgram.uniforms.pyramidReveal = { value: 0.0 }
    raymarchProgram.uniforms.mouseSpeed = { value: 0.0 }

    raymarchProgram.uniforms.uNoiseTexture = { value: assets.noiseMap }

    return {
      flowMaterial,
      flowNormalMaterial,
      mapDebugProgram,
      raymarchProgram
    }
  }, [targets])

  return materials
}
