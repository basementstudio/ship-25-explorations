import { useGLTF, useTexture } from "@react-three/drei"
import { useMemo } from "react"
import { GLTF } from "three-stdlib"
export type Assets = ReturnType<typeof useAssets>
import * as THREE from "three"

interface SphereGLTFResult extends GLTF {
  nodes: {
    Cube: THREE.Mesh
  }
}

export type SceneAssets = ReturnType<typeof useAssets>

export function useAssets() {
  const { nodes } = useGLTF(
    "/models/triangle-este-si.glb"
  ) as any as SphereGLTFResult
  const pyramid = nodes["Cube"] as THREE.Mesh

  const envMap = useTexture("/textures/hdri4.png")

  envMap.magFilter = THREE.NearestFilter
  envMap.minFilter = THREE.NearestFilter
  envMap.wrapS = THREE.RepeatWrapping
  envMap.wrapT = THREE.RepeatWrapping

  const noiseMap = useTexture("/textures/noise-LDR_RGBA_63.png")

  noiseMap.wrapS = THREE.RepeatWrapping
  noiseMap.wrapT = THREE.RepeatWrapping

  const assets = useMemo(() => {
    return {
      envMap,
      noiseMap,
      pyramid
    }
  }, [envMap, noiseMap])

  return assets
}
