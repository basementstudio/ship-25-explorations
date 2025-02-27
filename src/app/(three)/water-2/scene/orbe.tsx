import { createPortal, ThreeEvent, useFrame } from "@react-three/fiber"
import { useControls } from "leva"
import { MutableRefObject, useCallback, useMemo, useRef } from "react"
import * as THREE from "three"

import { valueRemap } from "~/lib/utils/math"

import { ORBE_WATER_CENTER } from "./constants"
import { renderFlow } from "./render-flow"
import { SceneAssets } from "./use-assets"
import { useLerpMouse } from "./use-lerp-mouse"
import { SceneMaterials } from "./use-materials"
import { SceneTargets } from "./use-targets"

function gain(number: number, gain: number) {
  const a = 0.5 * Math.pow(2.0 * (number < 0.5 ? number : 1.0 - number), gain)
  return number < 0.5 ? a : 1.0 - a
}

interface OrbeProps {
  materials: SceneMaterials
  assets: SceneAssets
  targets: SceneTargets
  activeCamera: THREE.Camera
  frameCount: MutableRefObject<number>
}

export function Orbe({
  materials,
  assets,
  targets,
  activeCamera,
  frameCount
}: OrbeProps) {
  const orbeFlowScene = useMemo(() => new THREE.Scene(), [])

  const [{ debugOrbe, renderOrbe }] = useControls(() => ({
    debugOrbe: true,
    renderOrbe: true
  }))

  const [handlePointerMoveOrbe, lerpMouseOrbe, vRefsOrbe] = useLerpMouse({
    lerpSpeed: 3
  })

  const orbeContainerRef = useRef<THREE.Mesh | THREE.Group | null>(null)

  useFrame(() => {
    const orbePointer = orbeContainerRef.current
    if (!orbePointer) return

    orbePointer.updateMatrixWorld()

    materials.orbeRaymarchMaterial.uniforms.uPyramidMatrix.value
      .copy(orbePointer.matrixWorld)
      .invert()
  })

  const orbePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      const point = e.point.clone().sub(ORBE_WATER_CENTER)

      const maxPoint = 0.2698

      const gainConstant = 1 / 2

      const p = new THREE.Vector2(
        valueRemap(point.x, -maxPoint, maxPoint, 0, 1),
        valueRemap(point.z, -maxPoint, maxPoint, 0, 1)
      )

      p.clamp(
        { x: 0, y: 0 },
        {
          x: 1,
          y: 1
        }
      )

      p.set(gain(p.x, gainConstant), gain(p.y, gainConstant))

      e.uv!.set(p.x, p.y)

      // Pass UV to pointer move handler
      handlePointerMoveOrbe(e)
    },
    [handlePointerMoveOrbe]
  )

  useFrame(({ gl, clock }, delta) => {
    const shouldDoubleRender = delta > 1 / 75

    // orbe
    lerpMouseOrbe(shouldDoubleRender ? delta / 2 : delta)
    renderFlow(
      gl,
      activeCamera,
      orbeFlowScene,
      clock,
      materials.orbeFlowMaterial,
      targets.orbeFlowFbo,
      vRefsOrbe,
      frameCount.current
    )

    if (shouldDoubleRender) {
      // orbe
      lerpMouseOrbe(delta / 2)
      renderFlow(
        gl,
        activeCamera,
        orbeFlowScene,
        clock,
        materials.orbeFlowMaterial,
        targets.orbeFlowFbo,
        vRefsOrbe,
        frameCount.current
      )
    }
  }, 1)

  return (
    <>
      {/* Flow simulation (orbe) */}
      {createPortal(
        <mesh>
          <planeGeometry args={[2, 2]} />
          <primitive object={materials.orbeFlowMaterial} />
        </mesh>,
        orbeFlowScene
      )}
      {/* Pointer events (orbe) */}
      <mesh
        visible={debugOrbe}
        scale={[0.26, 0.32, 0.26]}
        rotation={[0, 0, 0]}
        position={[
          ORBE_WATER_CENTER.x,
          ORBE_WATER_CENTER.y - 0.1,
          ORBE_WATER_CENTER.z
        ]}
        onPointerMove={orbePointerMove}
        onPointerOver={() => (vRefsOrbe.shouldReset = true)}
      >
        <primitive object={assets.pyramid.geometry} attach="geometry" />
        {/* <sphereGeometry args={[0.2, 16, 16]} /> */}
        <meshBasicMaterial
          depthTest={false}
          transparent
          opacity={0.1}
          wireframe
          color={"white"}
        />
      </mesh>

      {/* Raymarched water (orbe) */}
      <mesh visible={renderOrbe} position={ORBE_WATER_CENTER as any}>
        <group position={[0, 0, 0]} ref={orbeContainerRef as any} />
        <boxGeometry args={[0.8, 0.8, 0.8, 1, 1, 1]} />
        <primitive object={materials.orbeRaymarchMaterial} />
      </mesh>

      <mesh
        renderOrder={2}
        visible={debugOrbe}
        position={ORBE_WATER_CENTER as any}
      >
        <boxGeometry args={[0.8, 0.8, 0.8, 1, 1, 1]} />
        <meshBasicMaterial
          wireframe
          color={"red"}
          depthTest={false}
          transparent
        />
      </mesh>
      <OrbeSphere isVisible={debugOrbe} />
    </>
  )
}

function OrbeSphere({ isVisible }: { isVisible: boolean }) {
  const [handlePointerMoveSphere, lerpMouseSphere, vRefsSphere] = useLerpMouse({
    lerpSpeed: 3
  })

  // Create refs to store vectors needed for calculations
  const refs = useRef({
    sphereCenter: new THREE.Vector3(),
    prevDirection: new THREE.Vector3(),
    currentDirection: new THREE.Vector3(),
    rotationAxis: new THREE.Vector3()
  }).current

  const sphereRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    const sphere = sphereRef.current
    if (!sphere) return

    // Get sphere center in world space
    refs.sphereCenter.copy(ORBE_WATER_CENTER)

    // Only rotate if there's significant movement
    if (vRefsSphere.pointSpeed.lengthSq() > 0.00001) {
      // Calculate direction vectors from sphere center to contact points
      refs.prevDirection
        .copy(vRefsSphere.prevPoint)
        .sub(refs.sphereCenter)
        .normalize()
      refs.currentDirection
        .copy(vRefsSphere.point)
        .sub(refs.sphereCenter)
        .normalize()

      // Calculate rotation axis from the cross product of these directions
      refs.rotationAxis
        .crossVectors(refs.prevDirection, refs.currentDirection)
        .normalize()

      // Calculate rotation angle using the dot product
      const cosAngle = refs.prevDirection.dot(refs.currentDirection)
      // Clamp to avoid NaN from floating point errors
      const angle = Math.acos(Math.min(Math.max(cosAngle, -1), 1))

      // Apply rotation - but only if we have a valid rotation axis and angle
      if (
        refs.rotationAxis.lengthSq() > 0.00001 &&
        !isNaN(angle) &&
        angle > 0.001
      ) {
        sphere.rotateOnWorldAxis(refs.rotationAxis, angle)
      }
    }

    lerpMouseSphere(delta)
  })

  return (
    <mesh
      ref={sphereRef}
      onPointerMove={handlePointerMoveSphere}
      visible={isVisible}
      position={ORBE_WATER_CENTER as any}
      onPointerOver={() => (vRefsSphere.shouldReset = true)}
    >
      <sphereGeometry args={[0.25, 16, 16]} />
      <meshBasicMaterial wireframe color={"red"} />
    </mesh>
  )
}
