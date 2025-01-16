import { Camera, Orbit, Vec3 } from "ogl"
import { useEffect, useMemo } from "react"
import { useFrame } from "react-ogl"

import { GLOBAL_GL } from "~/gl"
import { useGlControls } from "~/gl/hooks/use-gl-controls"

export const orbitCamera = new Camera(GLOBAL_GL, {
  aspect: 45
})

orbitCamera.position.set(0, 15, 30)

interface OrbitHelperProps {
  isActive?: boolean
  camera?: Camera
}

export const OrbitHelper = ({ isActive, camera }: OrbitHelperProps) => {
  const activeCamera = useGlControls((s) => s.activeCamera)
  const orbitActive = activeCamera === "debug-orbit" || Boolean(isActive)

  const activeOrbitCamera = useMemo(() => camera || orbitCamera, [camera])

  const orbitControls = useMemo(() => {
    return new Orbit(activeOrbitCamera, {
      target: new Vec3(0, 0, 0),
      zoomSpeed: 0.3,
      element: GLOBAL_GL.canvas,
      rotateSpeed: 0.1,
      enabled: false
    })
  }, [activeOrbitCamera])

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
