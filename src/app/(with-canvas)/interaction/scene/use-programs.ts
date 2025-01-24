import { folder as levaFolder, useControls } from "leva"
import { Camera, OGLRenderingContext, RenderTarget, Vec3 } from "ogl";
import { ProgramTargets } from "./use-targets";
import { useMemo } from "react";
import { getInsideProgram } from "../programs/inside-program";
import { Assets } from "./use-assets";
import { getRaymarchProgram } from "../programs/raymarch-program";
import { INSIDE_MODEL_SCALE } from "./constants";

export type Programs = ReturnType<typeof usePrograms>

export function usePrograms(gl: OGLRenderingContext, targets: ProgramTargets, assets: Assets, camera: Camera) {

  const insideProgram = useMemo(() => {
    const program = getInsideProgram(gl)
    program.uniforms.uEnvMap = { value: assets.envMap }
    program.uniforms.uModelScale = { value: 1.0 }
    return program
  }, [gl, assets.envMap])

  const raymarchProgram = useMemo(() => {
    const program = getRaymarchProgram(gl)
    program.uniforms.time = { value: 0.0 }
    program.uniforms.uInsideDepthTexture = { value: targets.insideTarget.textures[0] }
    program.uniforms.uInsideNormalTexture = { value: targets.insideTarget.textures[1] }
    program.uniforms.uNear = { value: camera.near }
    program.uniforms.uFar = { value: camera.far }
    program.uniforms.uModelScale = { value: INSIDE_MODEL_SCALE }
    program.uniforms.uHitPosition = { value: new Vec3() }
    program.uniforms.noiseScale = { value: 5.0 }
    program.uniforms.noiseLength = { value: 0.4 }

    // lights
    program.uniforms.uEnvMap = { value: assets.envMap }
    return program
  }, [gl, camera, targets.insideTarget, assets.envMap])

  const programs = useMemo(() => {
    return {
      insideProgram,
      raymarchProgram,
    }
  }, [insideProgram, raymarchProgram])

  useControls({
    Interaction: levaFolder({
      noiseScale: {
        value: 5.0,
        min: 0.1,
        max: 10,
        onChange: (value) => {
          raymarchProgram.uniforms.noiseScale.value = value
        }
      },
      noiseLength: {
        value: 0.4,
        min: 0.1,
        max: 1.0,
        onChange: (value) => {
          raymarchProgram.uniforms.noiseLength.value = value
        }
      }
    })
  })

  return programs
}