import {
  Camera,
  Mesh,
  OGLRenderingContext,
  Program,
  RenderTarget,
  Transform
} from "ogl"

export interface ShadowParams {
  light: Camera
  width?: number
  height?: number
  target?: RenderTarget
  depthProgram?: Program
}

export interface AddParams {
  mesh: Mesh
  receive?: boolean
  cast?: boolean
  vertex?: string
  fragment?: string
  uniformProjectionName?: string
  uniformViewName?: string
  uniformShadowTextureName?: string
}

export interface MeshWithSahdow extends Mesh {
  colorProgram: Program
  depthProgram: Program
  isForceVisibility: boolean
  uniformProjectionName: string
  uniformViewName: string
  uniformShadowTextureName: string
  castShadow: boolean
  receiveShadow: boolean
}

export class Shadow {
  gl: OGLRenderingContext
  light: Camera
  target: RenderTarget
  targetUniform: { value: any }
  depthProgram: Program
  shadowMeshes: MeshWithSahdow[]

  constructor(
    gl: OGLRenderingContext,
    {
      light = new Camera(gl),
      width = 1024,
      height = width,
      target,
      depthProgram
    }: ShadowParams
  ) {
    this.gl = gl

    this.light = light

    this.target = target || new RenderTarget(gl, { width, height })
    this.targetUniform = { value: this.target.texture }

    this.depthProgram =
      depthProgram ||
      new Program(gl, {
        vertex: defaultVertex,
        fragment: defaultFragment,
        cullFace: false
      })

    this.shadowMeshes = []
  }

  /** Update unifroms for shadow camera projection */
  updateProjectionUniforms() {
    this.shadowMeshes.forEach((mesh: MeshWithSahdow) => {
      if (mesh.receiveShadow) {
        mesh.program.uniforms[mesh.uniformProjectionName] = {
          value: this.light.projectionMatrix
        }
        mesh.program.uniforms[mesh.uniformViewName] = {
          value: this.light.viewMatrix
        }
        mesh.program.uniforms[mesh.uniformShadowTextureName] =
          this.targetUniform
      }
    })
  }

  add({
    mesh: inputMesh,
    receive = true,
    cast = true,
    vertex = defaultVertex,
    fragment = defaultFragment,
    uniformProjectionName = "shadowProjectionMatrix",
    uniformViewName = "shadowViewMatrix",
    uniformShadowTextureName = "tShadow"
  }: AddParams): void {
    const mesh = inputMesh as MeshWithSahdow

    // Add uniforms to existing program
    if (receive) {
      mesh.receiveShadow = true
      mesh.uniformProjectionName = uniformProjectionName
      mesh.uniformViewName = uniformViewName
      mesh.uniformShadowTextureName = uniformShadowTextureName
      mesh.program.uniforms[uniformProjectionName] = {
        value: this.light.projectionMatrix
      }
      mesh.program.uniforms[uniformViewName] = { value: this.light.viewMatrix }
      mesh.program.uniforms[uniformShadowTextureName] = this.targetUniform
    }

    mesh.castShadow = cast
    // Store program for when switching between depth override
    mesh.colorProgram = mesh.program
    // Check that the mesh is not already added
    if (!~this.shadowMeshes.indexOf(mesh)) {
      this.shadowMeshes.push(mesh)
    }

    // Check if depth program already attached
    if (mesh.depthProgram) return

    // Use global depth override if nothing custom passed in
    if (vertex === defaultVertex && fragment === defaultFragment) {
      mesh.depthProgram = this.depthProgram
      return
    }

    // Create custom override program
    mesh.depthProgram = new Program(this.gl, {
      vertex,
      fragment,
      cullFace: false
    })
  }

  remove(mesh: Mesh) {
    const index = this.shadowMeshes.indexOf(mesh as MeshWithSahdow)
    if (index > -1) {
      this.shadowMeshes.splice(index, 1)
    }
  }

  setSize({
    width = 1024,
    height = width
  }: {
    width?: number
    height?: number
  }) {
    this.target.setSize(width, height)
    this.targetUniform.value = this.target.texture
    this.updateProjectionUniforms()
  }

  render({ scene }: { scene: Transform }) {
    // For depth render, replace program with depth override.
    // Hide meshes not casting shadows.
    scene.traverse((n) => {
      const node = n as MeshWithSahdow
      if (!node.draw) return
      if (!!~this.shadowMeshes.indexOf(node) && node.castShadow) {
        node.program = node.depthProgram
      } else {
        node.isForceVisibility = node.visible
        node.visible = false
      }
    })

    // Render the depth shadow map using the light as the camera
    this.gl.renderer.render({
      scene,
      camera: this.light,
      target: this.target
    })

    // Then switch the program back to the normal one
    scene.traverse((n) => {
      const node = n as MeshWithSahdow
      if (!node.draw) return
      if (!!~this.shadowMeshes.indexOf(node) && node.castShadow) {
        node.program = node.colorProgram
      } else {
        node.visible = node.isForceVisibility
      }
    })
  }
}

const defaultVertex = /* glsl */ `
    attribute vec3 position;
    attribute vec2 uv;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

const defaultFragment = /* glsl */ `
    precision highp float;

    vec4 packRGBA (float v) {
        vec4 pack = fract(vec4(1.0, 255.0, 65025.0, 16581375.0) * v);
        pack -= pack.yzww * vec2(1.0 / 255.0, 0.0).xxxy;
        return pack;
    }

    void main() {
        gl_FragColor = packRGBA(gl_FragCoord.z);
    }
`
