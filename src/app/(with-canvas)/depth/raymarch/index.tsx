"use client"

import { folder as levaFolder, useControls } from "leva"
import {
  Camera,
  Color,
  Euler,
  Mat3,
  Program,
  Quat,
  Raycast,
  TextureLoader,
  Vec2,
  Vec3
} from "ogl"
import { useEffect, useMemo, useRef } from "react"
import { useFrame, useLoader, useOGL } from "react-ogl"

import { QuadGeometry } from "~/gl/components/quad"
import { lerp } from "~/lib/utils/math"

import MAIN_FRAGMENT from "./main.frag"
import MAIN_VERTEX from "./main.vert"

export function RaymarchShader() {
  const vRefs = useRef({
    resolution: new Vec2(1, 1),
    mousePos: new Vec2(0, 0),
    animatedMousePos: new Vec2(0, 0),
    prevPos: new Vec2(0, 0),
    tmpSpeedVec: new Vec2(0, 0)
  })

  const matcap = useLoader(TextureLoader, "/textures/matcap-1.png")
  const reflection = useLoader(TextureLoader, "/textures/BasicStudio2.jpg")

  const gl = useOGL((state) => state.gl)
  reflection.wrapS = reflection.wrapT = gl.REPEAT
  reflection.minFilter = gl.LINEAR_MIPMAP_LINEAR
  reflection.magFilter = gl.LINEAR
  reflection.generateMipmaps = true
  reflection.needsUpdate = true

  reflection.update()

  const defaultColor = "#000"
  const defaultReflectionIntensity = 0.98

  const defaultRotation = new Euler(-0.47, 0, 0)
  const defaultPosition = new Vec3(0, 0.7, 4)

  const uniformsRef = useRef({
    projectedMousePos: { value: new Vec3(0, 0, 0) },
    mainColor: { value: new Color(defaultColor) },
    cPos: { value: defaultPosition },
    cameraQuaternion: { value: new Quat().fromEuler(defaultRotation) },
    fov: { value: 20 },
    matcapMap: { value: matcap },
    reflectionMap: { value: reflection },
    resolution: { value: vRefs.current.resolution },
    mousePos: { value: vRefs.current.animatedMousePos },
    reflectionIntensity: { value: defaultReflectionIntensity },
    uTime: { value: 0 },
    lightDirection: { value: new Vec3(0, 0.97, -0.14).normalize() },
    glossiness: { value: 0.39 },
    lightIntensity: { value: 1.1 },
    speed: { value: 0 },
    floorRotation: {
      value: new Mat3().fromQuaternion(new Quat(-0.3, 0, 0))
    }
  } satisfies Record<string, any>)

  useControls(() => ({
    Raymarch: levaFolder(
      {
        cameraRotation: {
          value: [defaultRotation.x, defaultRotation.y, defaultRotation.z],
          onChange: (value) => {
            uniformsRef.current.cameraQuaternion.value.fromEuler(
              new Euler(value[0], value[1], value[2])
            )
          }
        },
        cameraPosition: {
          value: {
            x: uniformsRef.current.cPos.value.x,
            y: uniformsRef.current.cPos.value.y,
            z: uniformsRef.current.cPos.value.z
          },
          onChange: (value) => {
            uniformsRef.current.cPos.value.set(value.x, value.y, value.z)
          }
        },
        mainColor: {
          value: defaultColor,
          onChange: (value) => {
            uniformsRef.current.mainColor.value.set(value)
          }
        },
        glossiness: {
          value: uniformsRef.current.glossiness.value,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (value) => {
            uniformsRef.current.glossiness.value = value
          }
        },
        lightDirection: {
          value: {
            x: uniformsRef.current.lightDirection.value.x,
            y: uniformsRef.current.lightDirection.value.y,
            z: uniformsRef.current.lightDirection.value.z
          },
          onChange: (value) => {
            uniformsRef.current.lightDirection.value
              .set(value.x, value.y, value.z)
              .normalize()
          }
        },
        lightIntensity: {
          value: uniformsRef.current.lightIntensity.value,
          min: 0,
          max: 10,
          onChange: (value) => {
            uniformsRef.current.lightIntensity.value = value
          }
        },
        reflectionIntensity: {
          value: defaultReflectionIntensity,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (value) => {
            uniformsRef.current.reflectionIntensity.value = value
          }
        }
      },
      {
        collapsed: false
      }
    )
  }))

  const programRef = useRef<Program>(null)

  const canvas = useOGL((state) => state.gl.canvas)

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    function handleScreenResize() {
      const { width, height } = canvas
      vRefs.current.resolution.x = width
      vRefs.current.resolution.y = height
    }

    handleScreenResize()
    window.addEventListener("resize", handleScreenResize)

    function handleMouseMove(event: MouseEvent) {
      const x = event.clientX / vRefs.current.resolution.x
      const y = 1 - event.clientY / vRefs.current.resolution.y

      vRefs.current.mousePos.x = x
      vRefs.current.mousePos.y = y
    }

    window.addEventListener("mousemove", handleMouseMove, { signal })

    return () => controller.abort()
  }, [canvas])

  const raycastCamera = useMemo(() => {
    return new Camera(gl, {})
  }, [gl])

  useFrame((_, time) => {
    vRefs.current.prevPos.copy(vRefs.current.animatedMousePos)

    vRefs.current.animatedMousePos.x = lerp(
      vRefs.current.animatedMousePos.x,
      vRefs.current.mousePos.x,
      0.05
    )
    vRefs.current.animatedMousePos.y = lerp(
      vRefs.current.animatedMousePos.y,
      vRefs.current.mousePos.y,
      0.05
    )

    vRefs.current.tmpSpeedVec.copy(vRefs.current.animatedMousePos)
    vRefs.current.tmpSpeedVec.sub(vRefs.current.prevPos)

    uniformsRef.current.speed.value += vRefs.current.tmpSpeedVec.len()

    uniformsRef.current.speed.value = lerp(
      uniformsRef.current.speed.value,
      0,
      0.01
    )

    raycastCamera.position.copy(uniformsRef.current.cPos.value)
    raycastCamera.position.copy(uniformsRef.current.cPos.value)
    raycastCamera.quaternion.copy(uniformsRef.current.cameraQuaternion.value)
    raycastCamera.fov = uniformsRef.current.fov.value
    raycastCamera.aspect =
      vRefs.current.resolution.x / vRefs.current.resolution.y
    raycastCamera.perspective({
      aspect: vRefs.current.resolution.x / vRefs.current.resolution.y,
      fov: uniformsRef.current.fov.value
    })
    raycastCamera.updateProjectionMatrix()

    const ndc = new Vec2(
      vRefs.current.animatedMousePos.x * 2 - 1,
      vRefs.current.animatedMousePos.y * 2 - 1
    )

    const caster = new Raycast()

    caster.castMouse(raycastCamera, ndc)

    const raycast = caster.intersectPlane({
      origin: new Vec3(0, 0, 0),
      normal: new Vec3(0, 1, 0)
    })

    if (raycast) {
      uniformsRef.current.projectedMousePos.value.set(
        raycast.x,
        raycast.y,
        raycast.z
      )
    }

    if (programRef.current) {
      programRef.current.uniforms.uTime.value = time * 0.0005
    }
  })

  return (
    <>
      <primitive object={raycastCamera} />
      <mesh>
        <QuadGeometry />
        <program
          ref={programRef}
          vertex={MAIN_VERTEX}
          fragment={MAIN_FRAGMENT}
          uniforms={uniformsRef.current}
        />
      </mesh>
    </>
  )
}
