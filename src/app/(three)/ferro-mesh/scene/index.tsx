"use client"

import {
  createPortal,
  ThreeEvent,
  useFrame,
  useThree
} from "@react-three/fiber"
import { useControls } from "leva"
import { useCallback, useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import { clamp, lerp, valueRemap } from "~/lib/utils/math"

import { Cameras } from "./cameras"
import { FLOW_SIM_SIZE } from "./constants"
import { DebugTextures } from "./debug-textures"
import { Atractor, setupScene, simulate } from "./fluid-sim"
import { useAssets } from "./use-assets"
import { DoubleFBO } from "./use-double-fbo"
import { LerpedMouse } from "./use-lerp-mouse"
import { useMaterials } from "./use-materials"
import { useTargets } from "./use-targets"
import { Env } from "./env"

export function Scene() {
  const activeCamera = useThree((state) => state.camera)

  const { simulation, positions, positionsTexture, normalsTexture } =
    useMemo(() => {
      const simulation = setupScene({ isDarkMode: false })

      const fluid = simulation.fluid!

      const positions = fluid.particlePosLerp
      const normals = fluid.particleNormal

      const positionsTexture = new THREE.DataTexture(
        positions,
        simulation.numX,
        simulation.numY,
        THREE.RGBAFormat,
        THREE.FloatType
      )
      positionsTexture.needsUpdate = true

      const normalsTexture = new THREE.DataTexture(
        normals,
        simulation.numX,
        simulation.numY,
        THREE.RGBAFormat,
        THREE.FloatType
      )

      return { simulation, positions, positionsTexture, normalsTexture }
    }, [])

  const [{ debugPointer, debugTextures, debugParticles }] = useControls(() => ({
    debugTextures: false,
    debugPointer: false,
    renderFloor: true,
    debugParticles: true
  }))

  const targets = useTargets()
  const { flowFbo, orbeFlowFbo } = targets
  const assets = useAssets()
  const materials = useMaterials(targets, assets)
  const {
    flowMaterial,
    raymarchMaterial,
    updateFlowCamera,
    ferroMeshMaterial
  } = materials

  ferroMeshMaterial.uniforms.uParticlesPositions.value = positionsTexture
  ferroMeshMaterial.uniforms.uParticlesNormals.value = normalsTexture

  updateFlowCamera(activeCamera as THREE.PerspectiveCamera)

  // const [handlePointerMoveFloor, lerpMouseFloor, vRefsFloor] = useLerpMouse({
  //   intercept: (e) => {
  //     e.point.z *= 0.5
  //   }
  // })

  const pointerDebugRef = useRef<THREE.Mesh>(null)

  const frameCount = useRef(0)

  const screenFbo = useMemo(() => {
    const fbo = new THREE.WebGLRenderTarget(10, 10, {
      depthBuffer: true,
      depthTexture: new THREE.DepthTexture(10, 10)
    })

    if (typeof window !== "undefined") {
      fbo.setSize(window.innerWidth, window.innerHeight)
    }

    return fbo
  }, [])

  const size = useThree((state) => state.size)

  useEffect(() => {
    screenFbo.setSize(size.width, size.height)
  }, [size])

  useEffect(() => {
    // for dev reasons, reset frame count when material gets reloaded
    frameCount.current = 0
  }, [flowMaterial, flowFbo])

  const flowScene = useMemo(() => new THREE.Scene(), [])

  const renderFlow = useCallback(
    (
      gl: THREE.WebGLRenderer,
      camera: THREE.Camera,
      scene: THREE.Scene,
      clock: THREE.Clock,
      material: THREE.RawShaderMaterial,
      fbo: DoubleFBO,
      lerpedMouse: LerpedMouse
    ) => {
      // Update uniforms
      material.uniforms.uMouse.value.set(
        lerpedMouse.smoothUv.x,
        lerpedMouse.smoothUv.y
      )
      material.uniforms.uFlowFeedBackTexture.value = fbo.read.texture
      material.uniforms.uMouseVelocity.value =
        lerpedMouse.velocity.length() * 100

      material.uniforms.uMouseDirection.value
        .set(lerpedMouse.velocity.x, lerpedMouse.velocity.y)
        .normalize()
      material.uniforms.uFrame.value = frameCount.current
      material.uniforms.uTime.value = clock.getElapsedTime()

      // Render flow sim
      gl.setRenderTarget(fbo.write)
      gl.render(scene, camera)
      gl.setRenderTarget(debugTextures ? screenFbo : null)
      fbo.swap()
    },
    [screenFbo, debugTextures]
  )

  const vActive = useRef(0)
  const vActiveFast = useRef(0)

  const vRefs = useMemo(
    () => ({
      pointerPos: new THREE.Vector3(),
      smoothPointerPos: new THREE.Vector3(),
      prevSmoothPointerPos: new THREE.Vector3(),
      pointerVelocity: new THREE.Vector3()
    }),
    []
  )

  const pointerPos = vRefs.pointerPos
  const smoothPointerPos = vRefs.smoothPointerPos
  const prevSmoothPointerPos = vRefs.prevSmoothPointerPos
  const pointerVelocity = vRefs.pointerVelocity

  const attractor = useMemo<Atractor>(
    () => ({
      position: [0, 0],
      velocity: [0, 0],
      radius: 0.05
    }),
    []
  )

  const [floorVec, floorPointerPos] = usePointerPos()
  const [wallVec, wallPointerPos] = usePointerPos()
  const [coneVec, conePointerPos] = usePointerPos()

  const pointers = [floorVec, wallVec, coneVec] as const

  const getActive = () => {
    let a = pointerPos.distanceTo(new THREE.Vector3(0, 0, 0))
    a -= 0.2
    a = clamp(0, 1, a)
    return a
  }

  // calculate pointers
  useFrame(({ camera }, delta) => {
    const activePointers = pointers.filter((p) => p.current.isActive)

    if (!activePointers.length) return

    let minDistance = Infinity

    // pointerPos.copy(floorVec.current.pointerPos)

    activePointers.forEach((p) => {
      const distToCamera = p.current.pointerPos.distanceTo(camera.position)
      if (distToCamera < minDistance) {
        minDistance = distToCamera
        pointerPos.copy(p.current.pointerPos)
      }
    })

    prevSmoothPointerPos.copy(smoothPointerPos)
    smoothPointerPos.lerp(pointerPos, Math.min(delta * 5, 1))

    pointerVelocity.copy(smoothPointerPos).sub(prevSmoothPointerPos)

    attractor.position[0] = valueRemap(
      pointerPos.x,
      0,
      particlesScale / 2,
      0.5,
      1
    )
    attractor.position[1] = valueRemap(
      pointerPos.z,
      0,
      particlesScale / 2,
      0.5,
      1
    )
    attractor.velocity[0] = pointerVelocity.x
    attractor.velocity[1] = pointerVelocity.z

    simulation.fluid!.mousePoint[0] = smoothPointerPos.x
    simulation.fluid!.mousePoint[1] = smoothPointerPos.y
    simulation.fluid!.mousePoint[2] = smoothPointerPos.z

    if (debugPointer && pointerDebugRef.current) {
      pointerDebugRef.current.position.copy(pointerPos)
    }
  })

  // update environment
  useFrame(({ scene }) => {
    const env = scene.environment
    if (!env) return
    const currentEnv = ferroMeshMaterial.uniforms.envMap.value
    if (currentEnv !== env) {
      console.log(env)

      ferroMeshMaterial.uniforms.envMap.value = env
      const rotation = ferroMeshMaterial.uniforms.envMapRotation
        .value as THREE.Matrix3

      const _e1 = /*@__PURE__*/ new THREE.Euler()
      const _m1 = /*@__PURE__*/ new THREE.Matrix4()

      _e1.copy(scene.environmentRotation)

      // accommodate left-handed frame
      _e1.x *= -1
      _e1.y *= -1
      _e1.z *= -1

      _e1.y *= -1
      _e1.z *= -1

      rotation.setFromMatrix4(_m1.makeRotationFromEuler(_e1))
    }
  })

  // Update flow simulation
  useFrame(({ gl, scene, clock }, delta) => {
    // console.log(mainScene.environment)
    simulate(delta, attractor)

    if (points.current && debugParticles) {
      points.current.geometry.attributes.position.needsUpdate = true
    }

    positionsTexture.needsUpdate = true
    normalsTexture.needsUpdate = true

    gl.setClearColor("#000")

    // const shouldDoubleRender = delta > 1 / 75

    // floor
    // lerpMouseFloor(shouldDoubleRender ? delta / 2 : delta)
    // renderFlow(
    //   gl,
    //   activeCamera,
    //   flowScene,
    //   clock,
    //   flowMaterial,
    //   flowFbo,
    //   vRefsFloor
    // )

    // if (shouldDoubleRender) {
    //   // floor
    //   lerpMouseFloor(delta / 2)
    //   renderFlow(
    //     gl,
    //     activeCamera,
    //     flowScene,
    //     clock,
    //     flowMaterial,
    //     flowFbo,
    //     vRefsFloor
    //   )
    // }

    ferroMeshMaterial.uniforms.uMousePosition.value.copy(smoothPointerPos)

    const activeFactor = getActive()

    vActive.current = lerp(vActive.current, activeFactor, 6 * delta)

    vActiveFast.current = lerp(vActiveFast.current, activeFactor, 10 * delta)

    ferroMeshMaterial.uniforms.uDiskRadius.value = valueRemap(
      vActive.current,
      0,
      1,
      0.35,
      0.5
    )

    ferroMeshMaterial.uniforms.uHeightMax.value = valueRemap(
      vActive.current,
      0,
      1,
      0.3,
      0.05
    )

    ferroMeshMaterial.uniforms.uHeightMin.value = valueRemap(
      vActive.current,
      0,
      1,
      0.15,
      0
    )

    ferroMeshMaterial.uniforms.uMainPyramidRadius.value = valueRemap(
      vActiveFast.current,
      0,
      1,
      0.35,
      0.35
    )

    ferroMeshMaterial.uniforms.uMainPyramidHeight.value = valueRemap(
      vActiveFast.current,
      0,
      1,
      0.55,
      0.55
    )

    ferroMeshMaterial.uniforms.uTime.value = clock.getElapsedTime()

    raymarchMaterial.uniforms.uFlowSize.value = FLOW_SIM_SIZE / 2

    gl.render(scene, activeCamera)
    frameCount.current++
  }, 1)

  const points = useRef<THREE.Points>(null)

  // const customPointerCallback = useCallback((e: ThreeEvent<PointerEvent>) => {
  //   // if(vRefs.shouldReset) {}
  //   // e.stopPropagation()
  //   // handlePointerMoveFloor(e)
  // }, [])

  return (
    <>
      {/* Flow simulation (floor) */}
      {createPortal(
        <mesh>
          {/* Has to be 2x2 to fill the screen using pos attr */}
          <planeGeometry args={[2, 2]} />
          <primitive object={flowMaterial} />
        </mesh>,
        flowScene
      )}

      {/* Pointer events (floor) */}
      <mesh
        visible={debugPointer}
        rotation={[Math.PI / -2, 0, 0]}
        position={[0, 0, 0]}
        {...floorPointerPos}
      >
        <planeGeometry args={[FLOW_SIM_SIZE, FLOW_SIM_SIZE, 10, 10]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh>
      <mesh
        visible={debugPointer}
        rotation={[0, 0, 0]}
        position={[0, 0, 0]}
        {...wallPointerPos}
      >
        <planeGeometry args={[FLOW_SIM_SIZE, FLOW_SIM_SIZE, 10, 10]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh>
      <mesh
        renderOrder={2}
        visible={debugPointer}
        rotation={[0, 0, 0]}
        position={[0, 0.22, 0]}
        {...conePointerPos}
      >
        {/* <coneGeometry args={[0.3, 0.3 * Math.sqrt(3), 10, 10]} /> */}
        <coneGeometry args={[0.31, 0.27 * Math.sqrt(3), 10, 10]} />
        <meshBasicMaterial
          transparent
          depthTest={false}
          color="red"
          wireframe
        />
      </mesh>
      <mesh
        visible={debugPointer}
        position={[0, 0, 0]}
        ref={pointerDebugRef as any}
        renderOrder={2}
      >
        <sphereGeometry args={[0.02, 10, 10]} />
        <meshBasicMaterial
          depthTest={false}
          color="green"
          wireframe
          transparent
        />
      </mesh>

      {/* Ferro mesh */}
      <mesh
        rotation={[Math.PI / -2, 0, 0]}
        position={[0, 0, 0]}
        scale={[2, 2, 2]}
      >
        <planeGeometry args={[2, 2, 300, 300]} />
        <primitive object={ferroMeshMaterial} />
      </mesh>

      {/* <mesh position={[0.4, 0, 0]}>
        <coneGeometry args={[0.6, 0.9, 30, 30]} />
        <meshStandardMaterial roughness={0} color="black" />
      </mesh> */}

      {/* points debug */}
      <points
        visible={debugParticles}
        frustumCulled={false}
        renderOrder={2}
        ref={points as any}
      >
        <bufferGeometry>
          <bufferAttribute
            args={[positions, 4]}
            attach="attributes-position"
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>

        <rawShaderMaterial
          transparent
          depthTest={false}
          precision={"highp"}
          fragmentShader={`
            precision highp float;
            varying float isActive;

            void main() {
              gl_FragColor = vec4(
                mix(vec3(1.0), vec3(1.0, 0.0, 0.0), isActive),
                mix(0.3, 1.0, isActive)
              );
            }
          `}
          vertexShader={`
            precision highp float;
            attribute vec4 position;
            
            uniform mat4 projectionMatrix;
            uniform mat4 viewMatrix;
            uniform mat4 modelMatrix;
            varying float isActive;

            void main() {
              isActive = position.w;
              gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position.xyz, 1.0);
              gl_PointSize = 3.0;
            }
          `}
        />
      </points>

      <Cameras />

      <Env />

      {/* <mesh
        position={[0.5, 0.5, 0.5]}
      >
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshStandardMaterial color="black" roughness={0} />
      </mesh> */}

      {/* Display textures */}
      {debugTextures && (
        <DebugTextures
          textures={{
            flow: flowFbo.read.texture,
            pyramidFlow: orbeFlowFbo.read.texture,
            screen: screenFbo.texture,
            screenDepth: screenFbo.depthTexture!
          }}
        />
      )}
    </>
  )
}

const particlesScale = 1.2

function usePointerPos() {
  const vRefs = useRef({
    pointerPos: new THREE.Vector3(),
    isActive: false
  })

  const onPointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    vRefs.current.pointerPos.copy(e.point)
    vRefs.current.isActive = true
  }, [])

  const onPointerOut = useCallback(() => {
    vRefs.current.isActive = false
  }, [])

  return [vRefs, { onPointerMove, onPointerOut }] as const
}
