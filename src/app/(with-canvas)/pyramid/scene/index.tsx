import { Camera, GLTFLoader, Mesh, RenderTarget } from "ogl"
import { useEffect, useMemo, useRef } from "react"
import { useFrame, useLoader, useOGL } from "react-ogl"

import { DEFAULT_SCISSOR } from "~/gl"
import { OrbitHelper } from "~/gl/components/devex/orbit"
import { useGlControls } from "~/gl/hooks/use-gl-controls"

import { getGlassProgram } from "../glass-program"
import { getRaymarchProgram } from "../raymarch-program"

export function Scene() {
  const gltf = useLoader(GLTFLoader, "/models/triangle.glb")

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
    const camera = new Camera(gl).perspective()
    camera.position.set(0, 0, 4)
    return camera
  }, [gl])

  const meshRef = useRef<Mesh | null>(null)

  const scene = useOGL((s) => s.scene)
  const renderer = useOGL((s) => s.renderer)

  const raymarchTarget = useMemo(() => {
    const target = new RenderTarget(gl, {
      width: 1024,
      height: 1024,
      depth: false,
      depthTexture: true
    })

    return target
  }, [gl])

  const raymarchProgram = useMemo(() => {
    const program = getRaymarchProgram(gl)
    program.uniforms.time = { value: 0.0 }
    return program
  }, [gl])

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
    }
    window.addEventListener("resize", handleResize)
    handleResize()
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [canvas, raymarchTarget, glassProgram])

  useFrame((_, time) => {
    const pyramid = meshRef.current
    if (!pyramid) return

    renderer.gl.scissor(
      DEFAULT_SCISSOR.x,
      DEFAULT_SCISSOR.y,
      DEFAULT_SCISSOR.width,
      DEFAULT_SCISSOR.height
    )

    gl.clearColor(1, 1, 1, 1)

    // set raymarch material
    pyramid.program = raymarchProgram

    raymarchProgram.uniforms.time.value = time * 0.0001

    renderer.render({
      scene: scene,
      camera: camera,
      target: raymarchTarget
    })

    const clearColor = 0.85

    gl.clearColor(clearColor, clearColor, clearColor, 1)

    // set normal material back
    // set normal material back
    pyramid.program = glassProgram

    renderer.render({
      scene: scene,
      camera: camera
    })
  })

  return (
    <>
      <OrbitHelper isActive={true} camera={camera} />
      <transform rotation={[Math.PI * 0.1, 0, 0]} position={[0, -0.35, 0]}>
        <mesh ref={meshRef}>
          <primitive object={geometry} />
          <primitive object={glassProgram} />
        </mesh>
      </transform>
    </>
  )
}
