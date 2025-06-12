"use client"

import {
  createPortal,
  ThreeEvent,
  useFrame,
  useThree
} from "@react-three/fiber"
import { useControls } from "leva"
import { animate, motionValue } from "motion"
import { useCallback, useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import { clamp, lerp, valueRemap } from "~/lib/utils/math"

import { CameraDebugHelper, Cameras, useCameraStore } from "./cameras"
import { FLOW_SIM_SIZE } from "./constants"
import { DebugTextures } from "./debug-textures"
import { Env } from "./env"
import { Atractor, setupScene, simulate } from "./fluid-sim"
import { useAssets } from "./use-assets"
import { useMaterials } from "./use-materials"
import { useTargets } from "./use-targets"

export function Scene() {
  const activeCamera = useCameraStore((state) => state.camera)

  const { simulation, positions, positionsTexture, normalsTexture, fluid } =
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

      return { simulation, positions, positionsTexture, normalsTexture, fluid }
    }, [])

  const [{ debugPointer, debugTextures, debugParticles }] = useControls(() => ({
    debugTextures: false,
    debugPointer: false,
    debugParticles: false
  }))

  const targets = useTargets()
  const assets = useAssets()
  const materials = useMaterials(targets, assets)
  const { ferroMeshMaterial } = materials

  ferroMeshMaterial.uniforms.uParticlesPositions.value = positionsTexture
  ferroMeshMaterial.uniforms.uParticlesNormals.value = normalsTexture

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

  const screenFboRef = useRef<typeof screenFbo | null>(screenFbo)

  screenFboRef.current = debugTextures ? screenFbo : null

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
  useFrame((_, delta) => {
    const activePointers = pointers.filter((p) => p.current.isActive)

    if (!activePointers.length) return

    let minDistance = Infinity

    // pointerPos.copy(floorVec.current.pointerPos)

    activePointers.forEach((p) => {
      const distToCamera = p.current.pointerPos.distanceTo(
        activeCamera.position
      )
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

  const mainScene = useMemo(() => new THREE.Scene(), [])

  // update environment
  useFrame(() => {
    const env = mainScene.environment
    if (!env) return
    const currentEnv = ferroMeshMaterial.uniforms.envMap.value
    if (currentEnv !== env) {
      ferroMeshMaterial.uniforms.envMap.value = env
      const rotation = ferroMeshMaterial.uniforms.envMapRotation
        .value as THREE.Matrix3

      const _e1 = /*@__PURE__*/ new THREE.Euler()
      const _m1 = /*@__PURE__*/ new THREE.Matrix4()

      _e1.copy(mainScene.environmentRotation)

      // accommodate left-handed frame
      _e1.x *= -1
      _e1.y *= -1
      _e1.z *= -1

      _e1.y *= -1
      _e1.z *= -1

      rotation.setFromMatrix4(_m1.makeRotationFromEuler(_e1))
    }
  })

  const pyramidReveal = motionValue(0)
  const staticPeaks = motionValue(0)

  useEffect(() => {
    const pointAFrom = new THREE.Vector3(0, 0.1, 0.3)
    const pointATo = new THREE.Vector3(0, 0.0, 0.5)

    const tmb = new THREE.Vector3()

    animate(pyramidReveal, 1, {
      duration: 2,
      delay: 1.5,
      ease: "circInOut",
      onUpdate: () => {
        ferroMeshMaterial.uniforms.uMainPyramidHeight.value =
          pyramidReveal.get()
      },
      onComplete: () => {
        fluid.enableMouse = true
      }
    })

    animate(0, 1, {
      duration: 1.8,
      delay: 3.3,
      ease: "easeInOut",
      onUpdate: (latest) => {
        tmb.lerpVectors(pointAFrom, pointATo, latest)
        if (!fluid.pointAPos) {
          fluid.pointAPos = tmb.toArray()
        }
        fluid.pointAPos[0] = tmb.x
        fluid.pointAPos[1] = tmb.y
        fluid.pointAPos[2] = tmb.z
      }
    })

    animate(staticPeaks, 1, {
      duration: 1,
      delay: 0.0,
      ease: "circInOut",
      onUpdate: () => {
        fluid.autoParticles = staticPeaks.get()
      },
      onComplete: () => {
        animate(staticPeaks, 0, {
          duration: 1.5,
          delay: 1.5,
          ease: "linear",
          onUpdate: () => {
            fluid.autoParticles = staticPeaks.get()
          }
        })
      }
    })
  }, [])

  // Update flow simulation
  useFrame(({ gl, clock }, delta) => {
    simulate(delta, attractor)

    if (points.current && debugParticles) {
      points.current.geometry.attributes.position.needsUpdate = true
    }

    positionsTexture.needsUpdate = true
    normalsTexture.needsUpdate = true

    gl.setClearColor("#000")

    ferroMeshMaterial.uniforms.uMousePosition.value.copy(smoothPointerPos)

    const activeFactor = getActive()

    vActive.current = lerp(vActive.current, activeFactor, 6 * delta)

    vActiveFast.current = lerp(vActiveFast.current, activeFactor, 10 * delta)

    // ferroMeshMaterial.uniforms.uDiskRadius.value = valueRemap(
    //   vActive.current,
    //   0,
    //   1,
    //   0.35,
    //   0.5
    // )

    // ferroMeshMaterial.uniforms.uHeightMax.value = valueRemap(
    //   vActive.current,
    //   0,
    //   1,
    //   0.3,
    //   0.05
    // )

    // ferroMeshMaterial.uniforms.uHeightMin.value = valueRemap(
    //   vActive.current,
    //   0,
    //   1,
    //   0.15,
    //   0
    // )

    // ferroMeshMaterial.uniforms.uMainPyramidRadius.value = valueRemap(
    //   vActiveFast.current,
    //   0,
    //   1,
    //   0.35,
    //   0.35
    // )

    // ferroMeshMaterial.uniforms.uMainPyramidHeight.value = valueRemap(
    //   vActiveFast.current,
    //   0,
    //   1,
    //   0.55,
    //   0.55
    // )

    ferroMeshMaterial.uniforms.uTime.value = clock.getElapsedTime()

    gl.setRenderTarget(targets.baseRenderFbo)
    gl.render(mainScene, activeCamera)

    gl.setRenderTarget(screenFboRef.current)
    gl.render(postprocessingScene, quadCamera)
    frameCount.current++
  }, 1)

  const points = useRef<THREE.Points>(null)
  const postprocessingScene = useMemo(() => new THREE.Scene(), [])
  const quadCamera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    []
  )

  quadCamera.position.z = 1

  return (
    <>
      {/* Post processing */}
      {createPortal(
        <>
          <mesh>
            <planeGeometry args={[2, 2]} />
            <primitive object={materials.postprocessingMaterial} />
          </mesh>
          <primitive object={quadCamera} />
        </>,
        postprocessingScene
      )}

      {/* Main renderer scene */}
      {createPortal(
        <>
          {/* Debug wireframes */}
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
          {/* ""Real"" mesh, I mean nothing is real here */}
          <mesh
            rotation={[Math.PI / -2, 0, 0]}
            position={[0, 0, 0]}
            scale={[2, 2, 2]}
          >
            <planeGeometry args={[2, 2, 300, 300]} />
            <primitive object={ferroMeshMaterial} />
          </mesh>
          <Env />
          <CameraDebugHelper />
          <Cameras />
        </>,
        mainScene
      )}

      {/* Display textures */}
      {debugTextures && (
        <DebugTextures
          textures={{
            base: targets.baseRenderFbo.texture,
            screen: screenFbo.texture
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
