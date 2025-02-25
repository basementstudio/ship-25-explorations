"use client"

import { MeshDiscardMaterial, useFBO, Wireframe } from "@react-three/drei"
import {
  createPortal,
  ThreeEvent,
  useFrame,
  useThree
} from "@react-three/fiber"
import { useCallback, useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import { Cameras } from "./cameras"
import {
  FLOW_SIM_SIZE,
  ORBE_WATER_CENTER,
  RAYMARCH_WATER_CENTER
} from "./constants"
import { RAYMARCH_FLOW_SIZE } from "./constants"
import { DebugTextures } from "./debug-textures"
import { useAssets } from "./use-assets"
import { useMaterials } from "./use-materials"
import { useTargets } from "./use-targets"
import { LerpedMouse, useLerpMouse } from "./use-lerp-mouse"
import { DoubleFBO } from "./use-double-fbo"
import { DiscardMaterail } from "./materials/mesh-discard-material"
import { useControls } from "leva"

export const hitConfig = {
  scale: 1
}

export function Scene() {
  const activeCamera = useThree((state) => state.camera)

  const targets = useTargets()
  const { flowFbo, orbeFlowFbo } = targets
  const assets = useAssets()
  const materials = useMaterials(targets, assets)
  const {
    flowMaterial,
    raymarchMaterial,
    orbeFlowMaterial,
    updateFlowCamera,
    orbeRaymarchMaterial
  } = materials

  updateFlowCamera(activeCamera as THREE.PerspectiveCamera)

  const [handlePointerMoveFloor, lerpMouseFloor, vRefsFloor] = useLerpMouse()
  const [handlePointerMoveOrbe, lerpMouseOrbe, vRefsOrbe] = useLerpMouse()

  const orbePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const point = e.point.clone().sub(ORBE_WATER_CENTER)

      const normal = point.normalize()
      // pointerGroup.position.copy(normal)

      // Mercator projection for UV mapping
      const longitude = Math.atan2(normal.x, normal.z)
      const latitude = Math.asin(normal.y)

      const uv = new THREE.Vector2(
        0.5 + longitude / (2 * Math.PI),
        0.5 - Math.log(Math.tan(Math.PI / 4 + latitude / 2)) / Math.PI
      )

      e.uv!.set(uv.x, uv.y)

      // Pass UV to pointer move handler
      handlePointerMoveOrbe(e)
    },
    [handlePointerMoveOrbe]
  )

  const frameCount = useRef(0)

  const screenFbo = useFBO()

  useEffect(() => {
    // for dev reasons, reset frame count when material gets reloaded
    frameCount.current = 0
  }, [flowMaterial, flowFbo])

  const flowScene = useMemo(() => new THREE.Scene(), [])

  const orbeFlowScene = useMemo(() => new THREE.Scene(), [])

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
      gl.setRenderTarget(screenFbo)
      fbo.swap()
    },
    [vRefsFloor, screenFbo]
  )

  // Update flow simulation
  useFrame(({ gl, scene, clock }, delta) => {
    const shouldDoubleRender = delta > 1 / 75

    lerpMouseFloor(shouldDoubleRender ? delta / 2 : delta)
    renderFlow(
      gl,
      activeCamera,
      flowScene,
      clock,
      flowMaterial,
      flowFbo,
      vRefsFloor
    )

    if (shouldDoubleRender) {
      lerpMouseFloor(delta / 2)
      renderFlow(
        gl,
        activeCamera,
        flowScene,
        clock,
        flowMaterial,
        flowFbo,
        vRefsFloor
      )
    }

    // Update orbe flow simulation
    lerpMouseOrbe(delta)
    renderFlow(
      gl,
      activeCamera,
      orbeFlowScene,
      clock,
      orbeFlowMaterial,
      orbeFlowFbo,
      vRefsOrbe
    )

    raymarchMaterial.uniforms.uFlowSize.value = FLOW_SIM_SIZE / 2

    gl.render(scene, activeCamera)
    frameCount.current++
  }, 1)

  const debugTextures = {
    flow: flowFbo.read.texture,
    flowWrite: flowFbo.write.texture,
    screen: screenFbo.texture
  }

  const [{ debugFloor, debugOrbe, renderFloor, renderOrbe }] = useControls(
    () => ({
      debugFloor: false,
      renderFloor: false,
      debugOrbe: true,
      renderOrbe: true
    })
  )

  const orbePointerRef = useRef<THREE.Mesh | null>(null)

  const pyramidV = useMemo(
    () => ({
      pyramidMatrix: new THREE.Matrix4(),
      pyramidWorldPosition: new THREE.Vector3(),
      pyramidWorldQuaternion: new THREE.Quaternion(),
      pyramidScale: new THREE.Vector3(10.01, 10.01, 10.01)
    }),
    []
  )

  useFrame(() => {
    const orbePointer = orbePointerRef.current
    if (!orbePointer) return

    pyramidV.pyramidMatrix.identity()

    orbePointer.getWorldPosition(pyramidV.pyramidWorldPosition)
    orbePointer.getWorldQuaternion(pyramidV.pyramidWorldQuaternion)

    // pyramidV.pyramidMatrix.makeRotationFromQuaternion(
    //   pyramidV.pyramidWorldQuaternion
    // )
    pyramidV.pyramidMatrix.makeScale(2, 2, 2)

    // pyramidV.pyramidMatrix.makeTranslation(
    //   -pyramidV.pyramidWorldPosition.x,
    //   -pyramidV.pyramidWorldPosition.y,
    //   -pyramidV.pyramidWorldPosition.z
    // )

    // pyramidV.pyramidMatrix.invert()

    orbeRaymarchMaterial.uniforms.uPyramidMatrix.value.copy(
      pyramidV.pyramidMatrix
    )
  })

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

      {/* Flow simulation (orbe) */}
      {createPortal(
        <mesh>
          <planeGeometry args={[2, 2]} />
          <primitive object={orbeFlowMaterial} />
        </mesh>,
        orbeFlowScene
      )}
      {/* Pointer events (floor) */}
      <mesh
        visible={debugFloor}
        rotation={[Math.PI / -2, 0, 0]}
        position={[0, 0, 0]}
        onPointerMove={handlePointerMoveFloor}
        onPointerOver={() => (vRefsFloor.shouldReset = true)}
      >
        <planeGeometry args={[FLOW_SIM_SIZE, FLOW_SIM_SIZE]} />
        <meshBasicMaterial map={flowFbo.read.texture} />
      </mesh>

      {/* Pointer events (orbe) */}
      <mesh
        visible={debugOrbe}
        scale={[0.2, 0.2, 0.2]}
        rotation={[0, 0, 0]}
        position={[
          ORBE_WATER_CENTER.x,
          ORBE_WATER_CENTER.y - 0.1,
          ORBE_WATER_CENTER.z
        ]}
        onPointerMove={orbePointerMove}
        onPointerOver={() => (vRefsOrbe.shouldReset = true)}
        ref={orbePointerRef}
      >
        <primitive object={assets.pyramid.geometry} attach="geometry" />
        {/* <DiscardMaterail /> */}
        <meshBasicMaterial depthTest={false} wireframe color={"red"} />
      </mesh>

      {/* Raymarched water (floor) */}
      <mesh
        visible={renderFloor}
        rotation={[Math.PI / -2, 0, 0]}
        position={RAYMARCH_WATER_CENTER as any}
      >
        <planeGeometry args={[RAYMARCH_FLOW_SIZE * 2, RAYMARCH_FLOW_SIZE]} />
        <primitive object={raymarchMaterial} />
      </mesh>

      {/* Raymarched water (orbe) */}
      <mesh position={ORBE_WATER_CENTER as any}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <primitive object={orbeRaymarchMaterial} />
      </mesh>

      <mesh visible={debugOrbe} position={ORBE_WATER_CENTER as any}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshBasicMaterial wireframe color={"red"} depthTest={false} />
      </mesh>

      <Cameras />

      {/* Display textures */}
      <DebugTextures textures={debugTextures} />
    </>
  )
}
