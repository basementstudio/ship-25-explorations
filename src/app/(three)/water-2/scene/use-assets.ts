import { useGLTF, useTexture } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { useMemo } from "react"

export type Assets = ReturnType<typeof useAssets>

export function useAssets() {
  const gl = useThree((state) => state.gl)
  const envMap = useTexture("/textures/hdri4.png")

  const noiseMap = useTexture("/textures/noise-LDR_RGBA_63.png")


  const assets = useMemo(() => {
    return {
      envMap,
      noiseMap,
    }
  }, [envMap, noiseMap])

  return assets
}
