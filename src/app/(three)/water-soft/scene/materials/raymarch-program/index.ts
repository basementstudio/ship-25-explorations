import { Mat4, Vec3 } from "ogl"
import { GLSL3, Matrix3, RawShaderMaterial } from "three"

import fragmentShader from "./shader/index.frag"
import vertexShader from "./shader/index.vert"

export function getRaymarchProgram() {
  const pyramidMatrix = new Mat4()
  pyramidMatrix.rotate(Math.PI / 4, new Vec3(0, 1, 0))
  pyramidMatrix.rotate(Math.PI / 5, new Vec3(1, 0, 0))

  const program = new RawShaderMaterial({
    vertexShader,
    fragmentShader,
    glslVersion: GLSL3,
    transparent: true,
    depthWrite: true,
    uniforms: {
      uPyramidMatrix: { value: pyramidMatrix },
      envMap: {
        value: null
      },
      envMapRotation: {
        value: new Matrix3()
      }
    }
  })

  return program
}
