import { folder as levaFolder, useControls } from "leva"
import {
  Camera,
  GLTFLoader,
  Mesh,
  RenderTarget,
  TextureLoader,
  Transform,
  Vec3
} from "ogl"
import { useEffect, useMemo, useRef } from "react"
import { createPortal, useFrame, useLoader, useOGL } from "react-ogl"

import { DEFAULT_SCISSOR } from "~/gl"
import { OrbitHelper } from "~/gl/components/devex/orbit"
import { QuadGeometry } from "~/gl/components/quad"
import { useGlControls } from "~/gl/hooks/use-gl-controls"

import { getInsideProgram } from "../inside-program"
import { getPostProgram } from "../post-program"
import { getRaymarchProgram } from "../raymarch-program"
import { DebugTextures } from "./debug-textures"

const INSIDE_MODEL_SCALE = 0.98
const OUTSIDE_MODEL_SCALE = 1.0

export function Scene() {
  const gl = useOGL((s) => s.gl)

  // maps
  const gltf = useLoader(GLTFLoader, "/models/nico-triangle.glb")
  const envMap = useLoader(TextureLoader, "/textures/flauta-hdri.png")

  envMap.wrapS = gl.REPEAT
  envMap.wrapT = gl.REPEAT
  envMap.minFilter = gl.LINEAR_MIPMAP_LINEAR
  envMap.magFilter = gl.LINEAR

  const noiseMap = useLoader(TextureLoader, "/textures/noise-LDR_RGBA_63.png")

  const geometry = useMemo(() => {
    const baseMesh = gltf.meshes[0].primitives[0] as any as Mesh
    const geometry = baseMesh.geometry

    return geometry
  }, [gltf])

  const setActiveCamera = useGlControls((state) => state.setActiveCamera)

  useEffect(() => {
    setActiveCamera("custom")
  }, [setActiveCamera])

  const cameraTarget = useMemo(() => new Vec3(0, 0.3, 0), [])

  const camera = useMemo(() => {
    const camera = new Camera(gl).perspective({
      near: 1,
      far: 20,
      fov: 10
    })
    camera.position.set(-5, 3, 5)
    return camera
  }, [gl])

  const meshRef = useRef<Mesh | null>(null)

  const scene = useOGL((s) => s.scene)
  const renderer = useOGL((s) => s.renderer)

  /** Render target used to store the inside information of the triangle */
  const insideTarget = useMemo(() => {
    const target = new RenderTarget(gl, {
      color: 2,
      width: 1024,
      height: 1024,
      depthTexture: false
    })
    return target
  }, [gl])

  const insideProgram = useMemo(() => {
    const program = getInsideProgram(gl)
    program.uniforms.uEnvMap = { value: envMap }
    program.uniforms.uModelScale = { value: 1.0 }
    return program
  }, [gl, envMap])

  const raymarchTarget = useMemo(() => {
    const target = new RenderTarget(gl, {
      width: 1024,
      height: 1024,
      depthTexture: true
    })

    return target
  }, [gl])

  const raymarchProgram = useMemo(() => {
    const program = getRaymarchProgram(gl)
    program.uniforms.time = { value: 0.0 }
    // program.uniforms.cPos = { value: camera.position }
    program.uniforms.uInsideDepthTexture = { value: insideTarget.textures[0] }
    program.uniforms.uInsideNormalTexture = { value: insideTarget.textures[1] }
    program.uniforms.uNear = { value: camera.near }
    program.uniforms.uFar = { value: camera.far }
    program.uniforms.uModelScale = { value: INSIDE_MODEL_SCALE }

    // lights
    program.uniforms.uEnvMap = { value: envMap }
    return program
  }, [gl, camera, insideTarget])

  const outsideTarget = useMemo(() => {
    const target = new RenderTarget(gl, {
      width: 1024,
      height: 1024,
      color: 2
    })
    return target
  }, [gl])

  // const outsideProgram = useMemo(() => {
  //   const program = getGlassProgram(gl)

  //   program.uniforms.uRaymarchTexture = { value: raymarchTarget.texture }
  //   program.uniforms.uDepthTexture = { value: raymarchTarget.depthTexture }
  //   return program
  // }, [gl, raymarchTarget])

  const canvas = useOGL((s) => s.gl.canvas) as HTMLCanvasElement

  const finalPassTarget = useMemo(() => {
    const target = new RenderTarget(gl, {
      width: 1024,
      height: 1024
    })
    return target
  }, [gl])

  useEffect(() => {
    const handleResize = () => {
      raymarchTarget.setSize(canvas.width, canvas.height)
      const width = Math.ceil(canvas.width / 1)
      const height = Math.ceil(canvas.height / 1)
      insideTarget.setSize(width, height)
      outsideTarget.setSize(width, height)
      raymarchTarget.setSize(width, height)
      finalPassTarget.setSize(width, height)
    }
    window.addEventListener("resize", handleResize)
    handleResize()
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [canvas, raymarchTarget, insideTarget, outsideTarget, finalPassTarget])

  const postScene = useMemo(() => {
    return new Transform()
  }, [])

  const postProgram = useMemo(() => {
    const program = getPostProgram(gl)

    // inside data
    program.uniforms.uInsideDepthTexture = { value: insideTarget.textures[0] }
    program.uniforms.uInsideColorTexture = { value: insideTarget.textures[1] }

    // outside data
    program.uniforms.uOutsideDepthTexture = {
      value: outsideTarget.textures[0]
    }
    program.uniforms.uOutsideColorTexture = {
      value: outsideTarget.textures[1]
    }

    // raymarch data
    program.uniforms.uRaymarchTexture = { value: raymarchTarget.texture }
    program.uniforms.uRaymarchDepthTexture = {
      value: raymarchTarget.depthTexture
    }

    // camera data
    program.uniforms.uNear = { value: camera.near }
    program.uniforms.uFar = { value: camera.far }

    // others
    program.uniforms.uTime = { value: 0 }
    program.uniforms.uNoise = { value: noiseMap }

    return program
  }, [
    gl,
    camera,
    insideTarget,
    raymarchTarget,
    outsideTarget,
    envMap,
    noiseMap
  ])

  useFrame((_, time) => {
    const pyramid = meshRef.current
    if (!pyramid) return

    insideProgram.uniforms.uModelScale.value = INSIDE_MODEL_SCALE

    renderer.gl.scissor(
      DEFAULT_SCISSOR.x,
      DEFAULT_SCISSOR.y,
      DEFAULT_SCISSOR.width,
      DEFAULT_SCISSOR.height
    )

    // RENDER: inside
    gl.clearColor(0, 0, 0, 0)

    pyramid.program = insideProgram
    pyramid.program.cullFace = gl.FRONT

    renderer.render({
      scene: scene,
      camera: camera,
      target: insideTarget
    })

    // RENDER: raymarch
    gl.clearColor(0, 0, 0, 0)

    // set raymarch material
    pyramid.program = raymarchProgram

    raymarchProgram.uniforms.time.value = time * 0.0001

    renderer.render({
      scene: scene,
      camera: camera,
      target: raymarchTarget
    })

    // RENDER: outside

    insideProgram.uniforms.uModelScale.value = OUTSIDE_MODEL_SCALE

    gl.clearColor(0, 0, 0, 0)

    // set outside material
    pyramid.program = insideProgram
    insideProgram.cullFace = gl.BACK

    renderer.render({
      scene: scene,
      camera: camera,
      target: outsideTarget
    })

    // RENDER: postprocessing, final pass
    const clearColor = 0.85

    gl.clearColor(clearColor, clearColor, clearColor, 1)

    pyramid.program = postProgram

    renderer.render({
      scene: postScene,
      camera: camera,
      target: finalPassTarget
    })
  })

  const { debugTargets } = useControls({
    Liquid: levaFolder({
      debugTargets: {
        value: false
      }
    })
  })

  const debugTextures = [
    insideTarget.textures[0],
    insideTarget.textures[1],
    outsideTarget.textures[0],
    outsideTarget.textures[1],
    raymarchTarget.texture,
    raymarchTarget.depthTexture,
    finalPassTarget.texture
  ]

  return (
    <>
      <DebugTextures
        textures={debugTextures}
        fullScreen={debugTargets ? undefined : debugTextures.length - 1}
      />
      {createPortal(
        <mesh>
          <QuadGeometry />
          <primitive object={postProgram} />
        </mesh>,
        postScene
      )}
      <OrbitHelper isActive={true} camera={camera} target={cameraTarget} />
      <transform position={[0, 0, 0]}>
        <mesh ref={meshRef}>
          <primitive object={geometry} />
          {/* <sphere args={[1, 32, 32]} /> */}
        </mesh>
      </transform>
    </>
  )
}
