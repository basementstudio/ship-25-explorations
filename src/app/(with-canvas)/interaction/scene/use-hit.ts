import { Camera, Mesh, Raycast, RaycastHit, Vec2 } from "ogl";
import { useEffect, useMemo, useRef } from "react";
import { useOGL } from "react-ogl";
import { useMouseMove } from "~/hooks/use-mouse-move";

interface UseHitParams {
  camera: Camera
  meshRef: React.RefObject<Mesh | null>
  onIntersect: (hit: RaycastHit) => void
}


const raycaster = new Raycast()

export function useHit({ camera, meshRef, onIntersect }: UseHitParams) {
  const renderer = useOGL((state) => state.renderer)

  const mouse = useMemo(() => new Vec2(), [])


  useMouseMove(e => {
    mouse.set(
      2.0 * (e.x / renderer.width) - 1.0,
      2.0 * (1.0 - e.y / renderer.height) - 1.0
    )

    raycaster.castMouse(camera, mouse)

    const raycastMesh = meshRef.current
    if (!raycastMesh) return

    const hits = raycaster.intersectBounds(raycastMesh)

    if (!hits.length) return

    const hitMesh = hits[0] as Mesh
    const hitData = hitMesh.hit as RaycastHit
    onIntersect(hitData)

  })
}
