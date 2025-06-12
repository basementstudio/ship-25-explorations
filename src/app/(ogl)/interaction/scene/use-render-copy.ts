import { Mesh, Program, RenderTarget, Transform, Texture, Geometry, OGLRenderingContext } from "ogl"
import { useMemo } from "react"
import { useOGL } from "react-ogl"

const copyVertex = /* glsl */`
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0, 1);
  }
`

const copyFragment = /* glsl */`
  precision highp float;
  uniform sampler2D tMap;
  varying vec2 vUv;
  
  void main() {
    gl_FragColor = texture2D(tMap, vUv);
  }
`

export function useRenderCopy(gl: OGLRenderingContext) {
  const renderer = useOGL((s) => s.renderer)

  const { scene, program } = useMemo(() => {
    // Create scene
    const scene = new Transform()

    // Create program
    const program = new Program(gl, {
      vertex: copyVertex,
      fragment: copyFragment,
      uniforms: {
        tMap: { value: null }
      }
    })

    // Create quad geometry
    const geometry = new Geometry(gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
      uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) }
    })

    // Create and add mesh to scene
    const mesh = new Mesh(gl, { geometry, program })
    mesh.setParent(scene)

    return { scene, program }
  }, [gl])

  // Return copy function
  return (sourceTexture: Texture, targetRenderTarget: RenderTarget) => {
    program.uniforms.tMap.value = sourceTexture

    renderer.render({
      scene,
      target: targetRenderTarget
    })
  }
} 
