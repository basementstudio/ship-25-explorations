import { animate, useMotionValue, useMotionValueEvent } from "motion/react"
import { Camera, Mesh, RenderTarget, Transform, Vec2, Vec3 } from "ogl"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { createPortal, useFrame, useOGL } from "react-ogl"

import { DEFAULT_SCISSOR, GLOBAL_GL } from "~/gl"
import { CameraFrustumHelper } from "~/gl/components/devex/camera-frustum"
import { OrbitHelper } from "~/gl/components/devex/orbit"
import { QuadGeometry } from "~/gl/components/quad"
import { useGlControls } from "~/gl/hooks/use-gl-controls"
import { lerp } from "~/lib/utils/math"

import { DebugTextures } from "./debug-textures"
import { useAssets } from "./use-assets"
import { useHit } from "./use-hit"
import { usePrograms } from "./use-programs"
import { useRenderCopy } from "./use-render-copy"
import { useTargets } from "./use-targets"

const DEBUG_CAMERA = new Camera(GLOBAL_GL).perspective({
  near: 1,
  far: 100,
  fov: 45
})

DEBUG_CAMERA.position.set(10, 10, 10)

const DEBUG_CAMERA_TARGET = new Vec3(0, 0, 0)

interface CameraConfig {
  near: number
  far: number
  fov: number
  position: Vec3
  target: Vec3
}

const CAMERA_FLOOR_CONFIG: CameraConfig = {
  near: 3,
  far: 10,
  fov: 10,
  position: new Vec3(0, 3, 7),
  target: new Vec3(0, -0.8, 0)
}

const CAMERA_PYRAMID_CONFIG: CameraConfig = {
  near: 4,
  far: 20,
  fov: 10,
  position: new Vec3(0, 3, 7),
  target: new Vec3(0, 0.5, 0)
}

export function Scene() {
  const gl = useOGL((s) => s.gl)
  const renderer = useOGL((s) => s.renderer)

  const assets = useAssets(gl)

  const setActiveCamera = useGlControls((state) => state.setActiveCamera)

  useEffect(() => {
    setActiveCamera("custom")
  }, [setActiveCamera])

  const camera = useMemo(() => {
    const camera = new Camera(gl).perspective({
      near: 6,
      far: 10,
      fov: 10
    })
    camera.position.set(0, 3, 7)
    camera.lookAt(new Vec3(0, 0, 0))
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

  const debugRaycastScene = useMemo(() => {
    return new Transform()
  }, [])

  const flowScene = useMemo(() => {
    return new Transform()
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const pixelRatio = renderer.dpr

      const width = canvas.width * pixelRatio
      const height = canvas.height * pixelRatio

      const aspect = width / height
      camera.aspect = aspect
      camera.updateProjectionMatrix()

      raymarchProgram.uniforms.fov.value = camera.fov

      // render targets
      raymarchTarget.setSize(width, height)
      finalPassTarget.setSize(width, height)

      // uniforms
      raymarchProgram.uniforms.resolution.value = new Vec2(width, height)
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
    renderer.dpr,
    camera,
    raymarchProgram,
    flowProgram
  ])

  const vRefs = useMemo(
    () => ({
      uv: new Vec2(),
      prevSmoothUv: new Vec2(),
      smoothUv: new Vec2(),
      position: new Vec3(),
      smoothPosition: new Vec3(),
      prevPos: new Vec3(0, 0, 0),
      tmpSpeedVec: new Vec3(0, 0, 0),
      speed: 0
    }),
    []
  )

  const raycastMeshRef = useRef<Mesh | null>(null)

  useHit({
    camera,
    meshRef: raycastMeshRef,
    onIntersect: (hit) => {
      vRefs.position.copy(hit.point)
      vRefs.uv.copy(hit.uv) //scale
      // console.log(hitData.uv)
    }
  })

  const renderCopy = useRenderCopy(gl)

  const frameCountRef = useRef(0)

  const pyramidReveal = useMotionValue(0)

  const cameraVectorsRefs = useMemo(
    () => ({
      position: new Vec3(),
      target: new Vec3()
    }),
    []
  )

  // lerp betweeen floor and pyramid camera
  const updatePyramidReveal = useCallback(
    (l: number) => {
      cameraVectorsRefs.position
        .copy(CAMERA_FLOOR_CONFIG.position)
        .lerp(CAMERA_PYRAMID_CONFIG.position, l)

      camera.position.copy(cameraVectorsRefs.position)

      cameraVectorsRefs.target
        .copy(CAMERA_FLOOR_CONFIG.target)
        .lerp(CAMERA_PYRAMID_CONFIG.target, l)
      camera.lookAt(cameraVectorsRefs.target)

      camera.perspective({
        near: lerp(CAMERA_FLOOR_CONFIG.near, CAMERA_PYRAMID_CONFIG.near, l),
        far: lerp(CAMERA_FLOOR_CONFIG.far, CAMERA_PYRAMID_CONFIG.far, l),
        fov: lerp(CAMERA_FLOOR_CONFIG.fov, CAMERA_PYRAMID_CONFIG.fov, l)
      })

      camera.updateProjectionMatrix()

      raymarchProgram.uniforms.fov.value = camera.fov
      raymarchProgram.uniforms.uNear.value = camera.near
      raymarchProgram.uniforms.uFar.value = camera.far
      raymarchProgram.uniforms.cameraQuaternion.value = camera.quaternion
      raymarchProgram.uniforms.pyramidReveal.value = l
    },
    [camera, cameraVectorsRefs, raymarchProgram]
  )

  useMotionValueEvent(pyramidReveal, "change", (value) => {
    updatePyramidReveal(value)
  })

  useEffect(() => {
    // pyramidReveal.set(1)
    animate(pyramidReveal, 1, {
      delay: 2,
      duration: 7,
      ease: "easeInOut",
      onUpdate: (value) => {
        updatePyramidReveal(value)
      }
    })
  }, [pyramidReveal, updatePyramidReveal])

  useFrame((_, time) => {
    vRefs.prevPos.copy(vRefs.smoothPosition)
    vRefs.smoothPosition.lerp(vRefs.position, 0.1)
    vRefs.prevSmoothUv.copy(vRefs.smoothUv)
    vRefs.smoothUv.lerp(vRefs.uv, 0.1)
    vRefs.tmpSpeedVec.copy(vRefs.smoothPosition)
    vRefs.tmpSpeedVec.sub(vRefs.prevPos)

    vRefs.speed += vRefs.tmpSpeedVec.len()

    vRefs.speed = lerp(vRefs.speed, 0, 0.05)

    // debug render
    renderer.render({
      camera: DEBUG_CAMERA,
      scene: debugRaycastScene,
      target: orbitDebugTarget
    })
    renderer.render({
      camera,
      scene: debugRaycastScene,
      target: mainDebugTarget
    })

    // render flow
    const shouldRenderFlow = pyramidReveal.get() < 0.7 || true
    if (shouldRenderFlow) {
      flowProgram.uniforms.uMouseVelocity.value = vRefs.smoothUv
        .clone()
        .sub(vRefs.prevSmoothUv)
        .len()
      flowProgram.uniforms.uMouse.value.copy(vRefs.smoothUv)

      renderer.render({
        camera,
        scene: flowScene,
        target: flowTargetB
      })

      frameCountRef.current++
      flowProgram.uniforms.uFrame.value = frameCountRef.current

      renderCopy(flowTargetB.texture, flowTargetA)
    }

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

    // update mouse effect
    raymarchProgram.uniforms.uHitPosition.value.copy(vRefs.smoothPosition)
    // update uniforms
    raymarchProgram.uniforms.time.value = time * 0.0001
    raymarchProgram.uniforms.mouseSpeed.value = vRefs.speed

    renderer.render({
      scene: raymarchScene,
      camera: camera,
      target: raymarchTarget
    })

    // RENDER: postprocessing, final pass
    const clearColor = 0.85

    gl.clearColor(clearColor, clearColor, clearColor, 1)
  })

  const orbitDebugTarget = useMemo(() => {
    const target = new RenderTarget(gl, {
      width: 1024 / 2,
      height: 1024 / 2
    })
    return target
  }, [gl])

  const mainDebugTarget = useMemo(() => {
    const target = new RenderTarget(gl, {
      width: 1024 / 2,
      height: 1024 / 2
    })
    return target
  }, [gl])

  const debugTextures = {
    raymarch: raymarchTarget.textures[0],
    // raymarchDepth: raymarchTarget.textures[1],
    orbit: orbitDebugTarget.texture,
    mainDebug: mainDebugTarget.texture,
    flow: flowTargetB.texture
  }

  return (
    <>
      <DebugTextures textures={debugTextures} />
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

      {/* <primitive object={camera} /> */}

      <OrbitHelper
        isActive={true}
        camera={DEBUG_CAMERA}
        target={DEBUG_CAMERA_TARGET}
      />

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
          <CameraFrustumHelper camera={camera} />
        </>,
        debugRaycastScene
      )}
    </>
  )
}
