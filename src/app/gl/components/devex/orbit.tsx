import { Camera, Orbit, Vec3 } from "ogl"
import { useEffect, useMemo } from "react"
import { useFrame } from "react-ogl"

import { GLOBAL_GL } from "~/gl"
import { useGlControls } from "~/gl/hooks/use-gl-controls"
import { useStateToRef } from "~/hooks/use-state-to-ref"

export const orbitCamera = new Camera(GLOBAL_GL, {
  aspect: 45
})

orbitCamera.position.set(0, 15, 30)

interface OrbitHelperProps {
  isActive?: boolean
  camera?: Camera
  target?: Vec3
}

export const OrbitHelper = ({ isActive, camera, target }: OrbitHelperProps) => {
  const activeCamera = useGlControls((s) => s.activeCamera)
  const orbitActive = activeCamera === "debug-orbit" || Boolean(isActive)

  const activeOrbitCamera = useMemo(() => camera || orbitCamera, [camera])
  const targetRef = useStateToRef(target)

  const orbitControls = useMemo(() => {
    return new Orbit(activeOrbitCamera, {
      target: targetRef.current || new Vec3(0, 0, 0),
      zoomSpeed: 0.3,
      element: GLOBAL_GL.canvas,
      rotateSpeed: 0.1,
      enabled: false
    })
  }, [activeOrbitCamera, targetRef])

  useEffect(() => {
    orbitControls.enabled = orbitActive
  }, [orbitActive, orbitControls])

  useFrame(({ size }) => {
    const aspect = size.width / size.height
    activeOrbitCamera.perspective({ aspect })
    orbitControls.update()
  })

  return <primitive dispose={null} object={activeOrbitCamera} />
}
