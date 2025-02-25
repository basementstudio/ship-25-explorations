import { OrbitControls, useHelper } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { memo, useEffect, useRef } from "react"
import { CameraHelper, PerspectiveCamera } from "three"
import { ORBE_WATER_CENTER } from "./constants"

export const mainCamera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
)

export const orbitCamera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
)

export const Cameras = memo(CamerasInner)

const cameraMap = {
  orbit: orbitCamera,
  main: mainCamera
}

function CamerasInner() {
  const activeCamera = useThree((state) => state.camera)
  const set = useThree((state) => state.set)

  const [{ camera }] = useControls(() => ({
    camera: {
      value: "main",
      options: ["main", "orbit"]
    }
  }))

  useEffect(() => {
    const selectedCamera = cameraMap[camera as keyof typeof cameraMap]
    set({ camera: selectedCamera })
    selectedCamera.updateProjectionMatrix()
  }, [camera])

  const mainCameraRef = useRef(mainCamera)

  useHelper(activeCamera === orbitCamera && mainCameraRef, CameraHelper)

  mainCamera.lookAt(ORBE_WATER_CENTER)

  return (
    <>
      <primitive
        object={mainCamera}
        position={[0, 1.5, 2.5]}
        fov={40}
        near={1}
        far={3}
      />
      <primitive object={orbitCamera} position={[0.7, 0.7, 0.7]} />
      <OrbitControls camera={orbitCamera} />
    </>
  )
}
