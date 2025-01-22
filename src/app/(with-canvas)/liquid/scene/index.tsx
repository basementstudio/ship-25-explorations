import { Camera, GLTFLoader, Mesh, RenderTarget } from "ogl"
import { useEffect, useMemo, useRef } from "react"
import { useFrame, useLoader, useOGL } from "react-ogl"

import { DEFAULT_SCISSOR } from "~/gl"
import { OrbitHelper } from "~/gl/components/devex/orbit"
import { useGlControls } from "~/gl/hooks/use-gl-controls"

import { getGlassProgram } from "../glass-program"
import { getInsideProgram } from "../inside-program"
import { getRaymarchProgram } from "../raymarch-program"

export function Scene() {
  const gltf = useLoader(GLTFLoader, "/models/nico-triangle.glb")

  const geometry = useMemo(() => {
    const baseMesh = gltf.meshes[0].primitives[0] as any as Mesh
    const geometry = baseMesh.geometry

    return geometry
  }, [gltf])

  const setActiveCamera = useGlControls((state) => state.setActiveCamera)

  useEffect(() => {
    setActiveCamera("custom")
  }, [setActiveCamera])

  const gl = useOGL((s) => s.gl)

  const camera = useMemo(() => {
    const camera = new Camera(gl).perspective({
      near: 0.5,
      far: 10,
      fov: 30
    })
    camera.position.set(0, 0, 6)
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

  const raymarchTarget = useMemo(() => {
    const target = new RenderTarget(gl, {
      width: 1024,
      height: 1024,
      depthTexture: true
    })

    return target
  }, [gl])

  const insideProgram = useMemo(() => {
    const program = getInsideProgram(gl)
    return program
  }, [gl])

  const raymarchProgram = useMemo(() => {
    const program = getRaymarchProgram(gl)
    program.uniforms.time = { value: 0.0 }
    program.uniforms.cPos = { value: camera.position }
    program.uniforms.uInsideDepthTexture = { value: insideTarget.textures[0] }
    program.uniforms.uInsideNormalTexture = { value: insideTarget.textures[1] }
    program.uniforms.uNear = { value: camera.near }
    program.uniforms.uFar = { value: camera.far }
    return program
  }, [gl, camera, insideTarget])

  const glassProgram = useMemo(() => {
    const program = getGlassProgram(gl)

    program.uniforms.uRaymarchTexture = { value: raymarchTarget.texture }
    program.uniforms.uDepthTexture = { value: raymarchTarget.depthTexture }
    return program
  }, [gl, raymarchTarget])

  const canvas = useOGL((s) => s.gl.canvas) as HTMLCanvasElement

  useEffect(() => {
    const handleResize = () => {
      const width = Math.ceil(canvas.width / 1)
      const height = Math.ceil(canvas.height / 1)
      raymarchTarget.setSize(width, height)
      glassProgram.uniforms.uRaymarchTexture.value = raymarchTarget.texture
      insideTarget.setSize(width, height)
    }
    window.addEventListener("resize", handleResize)
    handleResize()
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [canvas, raymarchTarget, glassProgram, insideTarget])

  useFrame((_, time) => {
    const pyramid = meshRef.current
    if (!pyramid) return

    renderer.gl.scissor(
      DEFAULT_SCISSOR.x,
      DEFAULT_SCISSOR.y,
      DEFAULT_SCISSOR.width,
      DEFAULT_SCISSOR.height
    )

    // RENDER: inside
    gl.clearColor(0, 0, 0, 0)

    pyramid.program = insideProgram

    renderer.render({
      scene: scene,
      camera: camera,
      target: insideTarget
    })

    // RENDER: raymarch
    gl.clearColor(1, 1, 1, 1)

    // set raymarch material
    pyramid.program = raymarchProgram

    raymarchProgram.uniforms.time.value = time * 0.0001
    raymarchProgram.uniforms.cPos.value = camera.position

    renderer.render({
      scene: scene,
      camera: camera,
      target: raymarchTarget
    })

    // RENDER: glass

    const clearColor = 0.85

    gl.clearColor(clearColor, clearColor, clearColor, 1)

    // set default material back
    pyramid.program = glassProgram

    renderer.render({
      scene: scene,
      camera: camera
    })
  })

  return (
    <>
      <OrbitHelper isActive={true} camera={camera} />
      <mesh ref={meshRef}>
        <primitive object={geometry} />
        {/* <cylinder /> */}
        <primitive object={glassProgram} />
      </mesh>
      {/* <transform rotation={[Math.PI * 0.1, 0, 0]} position={[0, -0.35, 0]}>
      </transform> */}
    </>
  )
}
