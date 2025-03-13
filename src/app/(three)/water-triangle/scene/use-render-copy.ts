import { useThree } from "@react-three/fiber"
import { useMemo } from "react"
import * as THREE from "three"

export function useRenderCopy() {
  const { gl } = useThree()

  const renderCopy = useMemo(() => {
    // Create a scene and camera for copying
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    // Create a full screen quad
    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        void main() {
          gl_FragColor = texture2D(tDiffuse, vUv);
        }
      `,
      uniforms: {
        tDiffuse: { value: null }
      }
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    return {
      copy: (source: THREE.Texture, target: THREE.WebGLRenderTarget) => {
        material.uniforms.tDiffuse.value = source
        const currentRenderTarget = gl.getRenderTarget()
        gl.setRenderTarget(target)
        gl.render(scene, camera)
        gl.setRenderTarget(currentRenderTarget)
      }
    }
  }, [gl])

  return renderCopy
}
