import { Mesh } from "ogl"

import { OGLRenderingContext, TextureLoader } from "ogl"

import { GLTFLoader } from "ogl"
import { useMemo } from "react"
import { useLoader } from "react-ogl"

export type Assets = ReturnType<typeof useAssets>

export function useAssets(gl: OGLRenderingContext) {
  const gltf = useLoader(GLTFLoader, "/models/tri-solid-hd.glb")
  const envMap = useLoader(TextureLoader, "/textures/hdri4.png")
  envMap.wrapS = gl.REPEAT
  envMap.wrapT = gl.REPEAT
  envMap.minFilter = gl.LINEAR_MIPMAP_LINEAR
  envMap.magFilter = gl.LINEAR

  const noiseMap = useLoader(TextureLoader, "/textures/noise-LDR_RGBA_63.png")
  noiseMap.wrapS = gl.REPEAT
  noiseMap.wrapT = gl.REPEAT
  noiseMap.minFilter = gl.LINEAR_MIPMAP_LINEAR
  noiseMap.magFilter = gl.LINEAR

  const geometry = useMemo(() => {
    const baseMesh = gltf.meshes[0].primitives[0] as any as Mesh
    const geometry = baseMesh.geometry

    return geometry
  }, [gltf])

  const assets = useMemo(() => {
    return {
      envMap,
      noiseMap,
      geometry
    }
  }, [envMap, noiseMap, geometry])

  return assets
}