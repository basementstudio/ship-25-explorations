import { Camera, Mesh, RenderTarget, Transform, Vec2, Vec3 } from "ogl"
import { useEffect, useMemo, useRef } from "react"
import { createPortal, useFrame, useOGL } from "react-ogl"

import { DEFAULT_SCISSOR } from "~/gl"
import { OrbitHelper } from "~/gl/components/devex/orbit"
import { QuadGeometry } from "~/gl/components/quad"
import { useGlControls } from "~/gl/hooks/use-gl-controls"

import { getPostProgram } from "../programs/post-program"
import { DebugTextures } from "./debug-textures"
import { useAssets } from "./use-assets"
import { useHit } from "./use-hit"
import { usePrograms } from "./use-programs"
import { useRenderCopy } from "./use-render-copy"
import { useTargets } from "./use-targets"

export function Scene() {
  const gl = useOGL((s) => s.gl)
  const renderer = useOGL((s) => s.renderer)

  const assets = useAssets(gl)
  const { noiseMap } = assets

  const setActiveCamera = useGlControls((state) => state.setActiveCamera)

  useEffect(() => {
    setActiveCamera("custom")
  }, [setActiveCamera])

  const cameraTarget = useMemo(() => new Vec3(0, 0, 0), [])

  const camera = useMemo(() => {
    const camera = new Camera(gl).perspective({
      near: 3,
      far: 7,
      fov: 10
    })
    camera.position.set(0, 2, 5)
    return camera
  }, [gl])

  const targets = useTargets(gl)
  const { raymarchTarget, finalPassTarget, flowTargetA, flowTargetB } = targets

  const programs = usePrograms(gl, targets, assets, camera)
  const { raymarchProgram, flowProgram } = programs

  const canvas = useOGL((s) => s.gl.canvas) as HTMLCanvasElement

  const raymarchScene = useMemo(() => {
    return new Transform()
  }, [])

  const postScene = useMemo(() => {
    return new Transform()
  }, [])

  const planeScene = useMemo(() => {
    return new Transform()
  }, [])

  const flowScene = useMemo(() => {
    return new Transform()
  }, [])

  const postProgram = useMemo(() => {
    const program = getPostProgram(gl)

    // raymarch data
    program.uniforms.uRaymarchTexture = { value: raymarchTarget.textures[0] }
    program.uniforms.uRaymarchDepthTexture = {
      value: raymarchTarget.textures[1]
    }

    // camera data
    program.uniforms.uNear = { value: camera.near }
    program.uniforms.uFar = { value: camera.far }
    program.uniforms.focusCenter = { value: 0.3 }

    // others
    program.uniforms.uTime = { value: 0 }
    program.uniforms.uNoise = { value: noiseMap }
    program.uniforms.uAspect = { value: 1 }

    return program
  }, [gl, camera, raymarchTarget, noiseMap])

  useEffect(() => {
    const handleResize = () => {
      const pixelRatio = renderer.dpr

      const width = canvas.width * pixelRatio
      const height = canvas.height * pixelRatio

      raymarchProgram.uniforms.fov.value = camera.fov

      // render targets
      raymarchTarget.setSize(width, height)
      finalPassTarget.setSize(width, height)

      // uniforms
      raymarchProgram.uniforms.resolution.value = new Vec2(width, height)
      postProgram.uniforms.uAspect.value = width / height
    }
    window.addEventListener("resize", handleResize)
    handleResize()
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [
    canvas,
    raymarchTarget,
    finalPassTarget,
    postProgram,
    renderer.dpr,
    camera.fov,
    raymarchProgram
  ])

  const hitData = useMemo(
    () => ({
      uv: new Vec2(),
      position: new Vec3(),
      smoothPosition: new Vec3()
    }),
    []
  )

  const raycastMeshRef = useRef<Mesh | null>(null)

  useHit({
    camera,
    meshRef: raycastMeshRef,
    onIntersect: (hit) => {
      hitData.position.copy(hit.point)
      hitData.uv.copy(hit.uv) //scale
      // console.log(hitData.uv)
    }
  })

  const renderCopy = useRenderCopy(gl)

  useFrame((_, time) => {
    hitData.smoothPosition.lerp(hitData.position, 0.1)

    // debug render
    renderer.render({
      camera,
      scene: planeScene,
      target: planeDebugTarget
    })

    // console.log(flowTargets.targetWrite.texture.id)

    // render flow
    flowProgram.uniforms.uMouse.value.copy(hitData.uv)
    // console.log(flowProgram.uniforms.uMouse.value)

    renderer.render({
      camera,
      scene: flowScene,
      target: flowTargetB
    })

    renderCopy(flowTargetB.texture, flowTargetA)

    // update mouse effect
    raymarchProgram.uniforms.uHitPosition.value.copy(hitData.smoothPosition)

    // update focus
    const distanceToTarget = camera.position.distance(cameraTarget)
    const focus = (distanceToTarget - camera.near) / (camera.far - camera.near)
    postProgram.uniforms.focusCenter.value = focus

    renderer.gl.scissor(
      DEFAULT_SCISSOR.x,
      DEFAULT_SCISSOR.y,
      DEFAULT_SCISSOR.width,
      DEFAULT_SCISSOR.height
    )
    gl.viewport(
      DEFAULT_SCISSOR.x,
      DEFAULT_SCISSOR.y,
      DEFAULT_SCISSOR.width,
      DEFAULT_SCISSOR.height
    )

    // RENDER: raymarch
    gl.clearColor(0, 0, 0, 0)

    raymarchProgram.uniforms.time.value = time * 0.0001

    renderer.render({
      scene: raymarchScene,
      camera: camera,
      target: raymarchTarget
    })

    // RENDER: postprocessing, final pass
    const clearColor = 0.85

    gl.clearColor(clearColor, clearColor, clearColor, 1)

    renderer.render({
      scene: postScene,
      camera: camera,
      target: finalPassTarget
    })
  })

  const planeDebugTarget = useMemo(() => {
    const target = new RenderTarget(gl, {
      width: 1024 / 2,
      height: 1024 / 2
    })
    return target
  }, [gl])

  const debugTextures = {
    raymarch: raymarchTarget.textures[0],
    raymarchDepth: raymarchTarget.textures[1],
    plane: planeDebugTarget.texture,
    flow: flowTargetB.texture,
    screen: finalPassTarget.texture
  }

  return (
    <>
      <DebugTextures textures={debugTextures} />
      {createPortal(
        <mesh>
          <QuadGeometry />
          <primitive object={postProgram} />
        </mesh>,
        postScene
      )}
      {createPortal(
        <mesh>
          <QuadGeometry />
          <primitive object={raymarchProgram} />
        </mesh>,
        raymarchScene
      )}
      {createPortal(
        <mesh>
          <QuadGeometry />
          <primitive object={flowProgram} />
        </mesh>,
        flowScene
      )}

      <OrbitHelper isActive={true} camera={camera} target={cameraTarget} />

      {createPortal(
        <>
          <mesh
            ref={raycastMeshRef}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={4}
            position={[0, 0, 0]}
          >
            <plane />
            <normalProgram />
          </mesh>
        </>,
        planeScene
      )}
    </>
  )
}
