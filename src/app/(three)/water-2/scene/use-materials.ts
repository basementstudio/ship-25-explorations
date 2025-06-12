import { useThree } from "@react-three/fiber"
import { useMemo } from "react"
import { Matrix4, PerspectiveCamera, Vector2, Vector3 } from "three"

import { FLOW_SIM_SIZE } from "./constants"
import { createFlowMaterial } from "./materials/flow-material"
import { createFlowNormalMaterial } from "./materials/flow-normal-material"
import { getMapDebugProgram } from "./materials/map-debug-program"
import { createOrbeRaymarchMaterial } from "./materials/orbe-raymarch-material"
import { getRaymarchProgram } from "./materials/raymarch-program"
import type { Assets } from "./use-assets"
import { flowSize, SceneTargets } from "./use-targets"

export type SceneMaterials = ReturnType<typeof useMaterials>

export function useMaterials(targets: SceneTargets, assets: Assets) {
  const size = useThree((state) => state.size)
  const materials = useMemo(() => {
    // FLOW MATERIAL (floor)
    const flowMaterial = createFlowMaterial(
      targets.flowFbo.read.texture,
      flowSize,
      { EDGE_DAMPING: "" }
    )

    // FLOW MATERIAL (orbe)
    const orbeFlowMaterial = createFlowMaterial(
      targets.orbeFlowFbo.read.texture,
      flowSize,
      {}
    )

    // FLOW NORMAL MATERIAL (TODO delete)
    const flowNormalMaterial = createFlowNormalMaterial()
    flowNormalMaterial.uniforms.uHeightmap.value = targets.flowFbo.read.texture

    const mapDebugProgram = getMapDebugProgram()

    // WATER FLOOR MATERIAL
    const raymarchMaterial = getRaymarchProgram()
    raymarchMaterial.uniforms.time = { value: 0.0 }
    raymarchMaterial.uniforms.uNear = { value: 0.1 }
    raymarchMaterial.uniforms.uFar = { value: 10 }
    raymarchMaterial.uniforms.uHitPosition = { value: new Vector3() }
    raymarchMaterial.uniforms.noiseScale = { value: 5.0 }
    raymarchMaterial.uniforms.noiseLength = { value: 0.4 }
    raymarchMaterial.uniforms.uFlowTexture = {
      value: targets.flowFbo.read.texture
    }
    raymarchMaterial.uniforms.fov = { value: 45 }
    raymarchMaterial.uniforms.cameraQuaternion = { value: null }
    raymarchMaterial.uniforms.resolution = {
      value: new Vector2(size.width, size.height)
    }
    raymarchMaterial.uniforms.pyramidReveal = { value: 0.0 }
    raymarchMaterial.uniforms.mouseSpeed = { value: 0.0 }
    raymarchMaterial.uniforms.uNoiseTexture = { value: assets.noiseMap }
    raymarchMaterial.uniforms.uEnvMap = { value: assets.envMap }
    raymarchMaterial.uniforms.uFlowSize = { value: FLOW_SIM_SIZE / 2 }

    // ORBE material
    const orbeRaymarchMaterial = createOrbeRaymarchMaterial()
    orbeRaymarchMaterial.uniforms.uFlowSize = { value: 0.001 }
    orbeRaymarchMaterial.uniforms.time = { value: 0.0 }
    orbeRaymarchMaterial.uniforms.uNear = { value: 0.1 }
    orbeRaymarchMaterial.uniforms.uFar = { value: 10 }
    orbeRaymarchMaterial.uniforms.uHitPosition = { value: new Vector3() }
    orbeRaymarchMaterial.uniforms.noiseScale = { value: 5.0 }
    orbeRaymarchMaterial.uniforms.noiseLength = { value: 0.4 }
    orbeRaymarchMaterial.uniforms.uFlowTexture = {
      value: targets.orbeFlowFbo.read.texture
    }
    orbeRaymarchMaterial.uniforms.fov = { value: 45 }
    orbeRaymarchMaterial.uniforms.cameraQuaternion = { value: null }
    orbeRaymarchMaterial.uniforms.resolution = {
      value: new Vector2(size.width, size.height)
    }
    orbeRaymarchMaterial.uniforms.pyramidReveal = { value: 0.0 }
    orbeRaymarchMaterial.uniforms.mouseSpeed = { value: 0.0 }
    orbeRaymarchMaterial.uniforms.uNoiseTexture = { value: assets.noiseMap }
    orbeRaymarchMaterial.uniforms.uPyramidMatrix = { value: new Matrix4() }
    orbeRaymarchMaterial.uniforms.uEnvMap = { value: assets.envMap }
    const updateFlowCamera = (camera: PerspectiveCamera) => {
      raymarchMaterial.uniforms.cameraQuaternion.value = camera.quaternion
      raymarchMaterial.uniforms.fov.value = camera.fov
      raymarchMaterial.uniforms.resolution.value = new Vector2(
        size.width,
        size.height
      )
      raymarchMaterial.uniforms.uNear.value = camera.near
      raymarchMaterial.uniforms.uFar.value = camera.far

      orbeRaymarchMaterial.uniforms.cameraQuaternion.value = camera.quaternion
      orbeRaymarchMaterial.uniforms.fov.value = camera.fov
      orbeRaymarchMaterial.uniforms.resolution.value = new Vector2(
        size.width,
        size.height
      )
      orbeRaymarchMaterial.uniforms.uNear.value = camera.near
      orbeRaymarchMaterial.uniforms.uFar.value = camera.far
    }

    return {
      flowMaterial,
      flowNormalMaterial,
      mapDebugProgram,
      raymarchMaterial,
      orbeRaymarchMaterial,
      orbeFlowMaterial,
      updateFlowCamera
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targets])

  // update resolution related uniforms
  materials.raymarchMaterial.uniforms.resolution.value.set(
    size.width,
    size.height
  )

  materials.orbeRaymarchMaterial.uniforms.resolution.value.set(
    size.width,
    size.height
  )

  return materials
}
