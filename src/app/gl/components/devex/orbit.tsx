import { Camera, Orbit, Vec3 } from "ogl"
import { useEffect, useMemo } from "react"
import { useFrame } from "react-ogl"

import { GLOBAL_GL } from "~/gl"
import { useGlControls } from "~/gl/hooks/use-gl-controls"

export const orbitCamera = new Camera(GLOBAL_GL, {
  aspect: 45
})

orbitCamera.position.set(0, 15, 30)

export const OrbitHelper = () => {
  const activeCamera = useGlControls((s) => s.activeCamera)
  const orbitActive = activeCamera === "debug-orbit"

  const orbitControls = useMemo(() => {
    return new Orbit(orbitCamera, {
      target: new Vec3(0, 0, 0),
      zoomSpeed: 0.3,
      element: GLOBAL_GL.canvas,
      rotateSpeed: 0.1,
      enabled: false
    })
  }, [])

  useEffect(() => {
    orbitControls.enabled = orbitActive
  }, [orbitActive, orbitControls])

  useFrame(({ size }) => {
    const aspect = size.width / size.height
    orbitCamera.perspective({ aspect })
    orbitControls.update()
  })

  return <primitive dispose={null} object={orbitCamera} />
}
