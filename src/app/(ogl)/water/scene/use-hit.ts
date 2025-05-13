import { Camera, Mesh, Raycast, RaycastHit, Vec2 } from "ogl"
import { useMemo } from "react"
import { useOGL } from "react-ogl"

import { useMouseMove } from "~/hooks/use-mouse-move"
import { valueRemap } from "~/lib/utils/math"

interface UseHitParams {
  camera: Camera
  meshRef: React.RefObject<Mesh | null>
  onIntersect: (hit: RaycastHit) => void
}

export const hitConfig = {
  scale: 1
}

const raycaster = new Raycast()

export function useHit({ camera, meshRef, onIntersect }: UseHitParams) {
  const renderer = useOGL((state) => state.renderer)

  const mouse = useMemo(() => new Vec2(), [])

  useMouseMove((e) => {
    mouse.set(
      2.0 * (e.x / renderer.width) - 1.0,
      2.0 * (1.0 - e.y / renderer.height) - 1.0
    )

    if (hitConfig.scale !== 1) {
      mouse.x = valueRemap(mouse.x, -1, 1, 0, 1)
      mouse.y = valueRemap(mouse.y, -1, 1, 0, 1)

      // TODO adapt this on debug
      mouse.multiply(hitConfig.scale)
      mouse.x %= 1
      mouse.y %= 1

      mouse.x = valueRemap(mouse.x, 0, 1, -1, 1)
      mouse.y = valueRemap(mouse.y, 0, 1, -1, 1)
    }

    raycaster.castMouse(camera, mouse)

    const raycastMesh = meshRef.current
    if (!raycastMesh) return

    raycastMesh.updateMatrixWorld()

    const hits = raycaster.intersectMeshes([raycastMesh])

    if (!hits.length) return

    const hitMesh = hits[0] as Mesh
    const hitData = hitMesh.hit as RaycastHit
    onIntersect(hitData)
  })
}
