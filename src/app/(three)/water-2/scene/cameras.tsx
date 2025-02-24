import { OrbitControls, useHelper } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { useRef } from "react"
import { CameraHelper, PerspectiveCamera } from "three"

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

export function Cameras() {
  const activeCamera = useThree((state) => state.camera)
  const set = useThree((state) => state.set)

  useControls(() => ({
    camera: {
      value: "orbit",
      options: ["main", "orbit"],
      onChange: (value) => {
        if (value === "main") {
          set({ camera: mainCamera })
        } else {
          set({ camera: orbitCamera })
        }
      },
      transient: false
    }
  }))

  const mainCameraRef = useRef(mainCamera)

  useHelper(activeCamera === orbitCamera && mainCameraRef, CameraHelper)

  mainCamera.lookAt(0, 0, 0)

  return (
    <>
      <primitive
        object={mainCamera}
        position={[0, 1.5, 2.5]}
        fov={40}
        near={1}
        far={3}
      />
      <primitive object={orbitCamera} position={[2, 2, 2]} />
      <OrbitControls camera={orbitCamera} />
    </>
  )
}
