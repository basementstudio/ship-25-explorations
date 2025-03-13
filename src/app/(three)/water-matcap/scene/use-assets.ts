import { useGLTF, useTexture } from "@react-three/drei"
import { useMemo } from "react"
import { GLTF } from "three-stdlib"
export type Assets = ReturnType<typeof useAssets>
import * as THREE from "three"

interface SphereGLTFResult extends GLTF {
  nodes: {
    Cylinder: THREE.Mesh
  }
}

export type SceneAssets = ReturnType<typeof useAssets>

export function useAssets() {
  const { nodes } = useGLTF(
    "/models/extruded-try-soft.glb"
  ) as any as SphereGLTFResult

  const pyramid = nodes["Cylinder"] as THREE.Mesh

  const envMap = useTexture("/textures/hdri4.png")

  const matcap = useTexture("/textures/matcap-7.jpg")

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
      matcap,
      pyramid
    }
  }, [envMap, noiseMap, matcap, pyramid])

  return assets
}
