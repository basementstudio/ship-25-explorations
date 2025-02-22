import { useThree } from "@react-three/fiber"
import { useMemo } from "react"
import { PerspectiveCamera, Vector2, Vector3 } from "three"

import { createFlowMaterial } from "./materials/flow-material"
import { createFlowNormalMaterial } from "./materials/flow-normal-material"
import { getMapDebugProgram } from "./materials/map-debug-program"
import { getRaymarchProgram } from "./materials/raymarch-program"
import type { Assets } from "./use-assets"
import { flowSize, SceneTargets } from "./use-targets"

export type SceneMaterials = ReturnType<typeof useMaterials>

export function useMaterials(
  targets: SceneTargets,
  assets: Assets,
  camera: PerspectiveCamera
) {
  const size = useThree((state) => state.size)
  const materials = useMemo(() => {
    const flowMaterial = createFlowMaterial(
      targets.flowFbo.read.texture,
      flowSize
    )

    const flowNormalMaterial = createFlowNormalMaterial()
    flowNormalMaterial.uniforms.uHeightmap.value = targets.flowFbo.read.texture

    const mapDebugProgram = getMapDebugProgram()

    const raymarchMaterial = getRaymarchProgram()
    raymarchMaterial.uniforms.uFlowSize = { value: 0.001 }
    raymarchMaterial.uniforms.time = { value: 0.0 }
    raymarchMaterial.uniforms.uNear = { value: camera.near }
    raymarchMaterial.uniforms.uFar = { value: camera.far }
    raymarchMaterial.uniforms.uHitPosition = { value: new Vector3() }
    raymarchMaterial.uniforms.noiseScale = { value: 5.0 }
    raymarchMaterial.uniforms.noiseLength = { value: 0.4 }
    raymarchMaterial.uniforms.uFlowTexture = {
      value: targets.flowFbo.read.texture
    }
    raymarchMaterial.uniforms.fov = { value: camera.fov }
    raymarchMaterial.uniforms.cameraQuaternion = { value: camera.quaternion }
    raymarchMaterial.uniforms.resolution = {
      value: new Vector2(size.width, size.height)
    }
    raymarchMaterial.uniforms.pyramidReveal = { value: 0.0 }
    raymarchMaterial.uniforms.mouseSpeed = { value: 0.0 }

    raymarchMaterial.uniforms.uNoiseTexture = { value: assets.noiseMap }

    return {
      flowMaterial,
      flowNormalMaterial,
      mapDebugProgram,
      raymarchMaterial
    }
  }, [targets])

  return materials
}
