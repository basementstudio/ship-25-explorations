import { folder as levaFolder, useControls } from "leva"
import { Camera, OGLRenderingContext, Vec2, Vec3 } from "ogl"
import { useMemo } from "react"

import { getFlowProgram } from "../programs/flow-program"
import { getRaymarchProgram } from "../programs/raymarch-program"
import { Assets } from "./use-assets"
import { flowSize, ProgramTargets } from "./use-targets"

export type Programs = ReturnType<typeof usePrograms>

export function usePrograms(
  gl: OGLRenderingContext,
  targets: ProgramTargets,
  assets: Assets,
  camera: Camera
) {
  const flowProgram = useMemo(() => {
    const program = getFlowProgram(gl)
    program.uniforms.uFlowFeedBackTexture = {
      value: targets.flowTargetA.textures[0]
    }
    program.uniforms.uMouse = { value: new Vec2(0.5, 0.5) }
    program.uniforms.uResolution = {
      value: new Vec2(flowSize, flowSize)
    }
    program.uniforms.uMouseVelocity = { value: 0.0 }
    program.uniforms.uFrame = { value: 0 }
    return program
  }, [gl, targets.flowTargetA])

  const raymarchProgram = useMemo(() => {
    const program = getRaymarchProgram(gl)
    program.uniforms.time = { value: 0.0 }
    program.uniforms.uNear = { value: camera.near }
    program.uniforms.uFar = { value: camera.far }
    program.uniforms.uHitPosition = { value: new Vec3() }
    program.uniforms.noiseScale = { value: 5.0 }
    program.uniforms.noiseLength = { value: 0.4 }
    program.uniforms.uFlowTexture = { value: targets.flowTargetB.textures[0] }
    program.uniforms.fov = { value: camera.fov }
    program.uniforms.cameraQuaternion = { value: camera.quaternion }
    program.uniforms.resolution = {
      value: new Vec2(gl.canvas.width, gl.canvas.height)
    }
    program.uniforms.pyramidReveal = { value: 0.0 }
    program.uniforms.mouseSpeed = { value: 0.0 }

    program.uniforms.uNoiseTexture = { value: assets.noiseMap }

    // lights
    program.uniforms.uEnvMap = { value: assets.envMap }
    return program
  }, [gl, camera, assets.envMap, targets.flowTargetB, assets.noiseMap])

  const programs = useMemo(() => {
    return {
      raymarchProgram,
      flowProgram
    }
  }, [raymarchProgram, flowProgram])

  useControls({
    Interaction: levaFolder({
      noiseScale: {
        value: 10,
        min: 0.1,
        max: 10,
        onChange: (value) => {
          raymarchProgram.uniforms.noiseScale.value = value
        }
      },
      noiseLength: {
        value: 1,
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
