import { GLSL3, Matrix3, RawShaderMaterial } from "three"

import fragmentShader from "./shader/index.frag"
import vertexShader from "./shader/index.vert"

export function createFlowSurfaceMaterial() {
  const material = new RawShaderMaterial({
    uniforms: {
      uHeightmap: { value: null },
      uMatcap: { value: null },
      envMap: { value: null },
      envMapRotation: { value: new Matrix3() }
    },
    vertexShader,
    fragmentShader,
    glslVersion: GLSL3
  })

  return material
}
