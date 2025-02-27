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

  const envMap2 = useTexture("/textures/studio_small_02_1k.png")
  envMap2.magFilter = THREE.NearestFilter
  envMap2.minFilter = THREE.NearestFilter
  envMap2.wrapS = THREE.RepeatWrapping
  envMap2.wrapT = THREE.RepeatWrapping

  const noiseMap = useTexture("/textures/noise-LDR_RGBA_63.png")
  noiseMap.magFilter = THREE.LinearFilter
  noiseMap.minFilter = THREE.LinearFilter
  noiseMap.wrapS = THREE.RepeatWrapping
  noiseMap.wrapT = THREE.RepeatWrapping

  const assets = useMemo(() => {
    return {
      envMap,
      envMap2,
      noiseMap,
      pyramid
    }
  }, [envMap, envMap2, noiseMap])

  return assets
}
