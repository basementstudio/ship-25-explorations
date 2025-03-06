import { OrbitControls, useHelper } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { memo, useEffect, useRef } from "react"
import { CameraHelper, PerspectiveCamera } from "three"
import { create } from "zustand"

export const mainCamera = new PerspectiveCamera(75, 1, 1, 100)

export const orbitCamera = new PerspectiveCamera(75, 1, 1, 100)

export const Cameras = memo(CamerasInner)

const cameraMap = {
  orbit: orbitCamera,
  main: mainCamera
}

interface CameraStore {
  camera: PerspectiveCamera
  set: (camera: PerspectiveCamera) => void
}

export const useCameraStore = create<CameraStore>((set) => ({
  camera: mainCamera,
  set: (camera) => set({ camera })
}))

function CamerasInner() {
  const set = useCameraStore((state) => state.set)

  const threeSet = useThree((state) => state.set)

  const [{ camera }] = useControls(() => ({
    camera: {
      value: "main",
      options: ["main", "orbit"]
    }
  }))

  useEffect(() => {
    mainCamera.lookAt(0, 0.2, 0)
    const selectedCamera = cameraMap[camera as keyof typeof cameraMap]
    set(selectedCamera)
    selectedCamera.updateProjectionMatrix()
    threeSet({ camera: selectedCamera })
  }, [camera])

  const size = useThree((state) => state.size)

  return (
    <>
      <primitive
        object={mainCamera}
        position={[0, 0.1, 2]}
        fov={30}
        near={0.1}
        far={4}
        aspect={size.width / size.height}
      />
      <primitive
        object={orbitCamera}
        near={0.1}
        far={7}
        position={[0.7, 0.7, 0.7]}
        aspect={size.width / size.height}
      />
      <OrbitControls camera={orbitCamera} />
    </>
  )
}

export function CameraDebugHelper() {
  const mainCameraRef = useRef(mainCamera)
  const activeCamera = useCameraStore((state) => state.camera)

  useHelper(activeCamera === orbitCamera && mainCameraRef, CameraHelper)

  return null
}
