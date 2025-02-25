import { useMemo } from "react"
import * as THREE from "three"

import { ThreeEvent } from "@react-three/fiber"
import { useCallback } from "react"

export type LerpedMouse = ReturnType<typeof useLerpMouse>[2]

export function useLerpMouse() {
  const vRefs = useMemo(
    () => ({
      uv: new THREE.Vector2(),
      smoothUv: new THREE.Vector2(),
      prevSmoothUv: new THREE.Vector2(),
      velocity: new THREE.Vector2(),
      shouldReset: true
    }),
    []
  )

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (e.uv) {
        vRefs.uv.copy(e.uv)
      }
    },
    [vRefs]
  )

  const lerpMouseFloor = useCallback(
    (delta: number) => {
      if (vRefs.shouldReset) {
        vRefs.smoothUv.copy(vRefs.uv)
        vRefs.prevSmoothUv.copy(vRefs.uv)
        vRefs.shouldReset = false
      }

      vRefs.prevSmoothUv.copy(vRefs.smoothUv)

      const l = Math.min(delta * 10, 1)
      vRefs.smoothUv.lerp(vRefs.uv, l)
      vRefs.velocity.subVectors(
        vRefs.smoothUv,
        vRefs.prevSmoothUv
      )
    },
    [vRefs]
  )

  return [
    handlePointerMove,
    lerpMouseFloor,
    vRefs
  ] as const
}