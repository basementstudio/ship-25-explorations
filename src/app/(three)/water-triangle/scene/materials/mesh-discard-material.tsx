import { useMemo } from "react"
import { GLSL3, RawShaderMaterial } from "three"

export function DiscardMaterail() {
  const material = useMemo(
    () =>
      new RawShaderMaterial({
        vertexShader: /*glsl*/ `
      in vec3 position;
      uniform mat4 projectionMatrix;
      uniform mat4 viewMatrix;
      uniform mat4 modelMatrix;


      void main() {
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: /*glsl*/ `
      void main() {
        discard;
      }
    `,
        glslVersion: GLSL3
      }),
    []
  )

  material.customProgramCacheKey = () => "discard-material-custom"

  return <primitive object={material} />
}
