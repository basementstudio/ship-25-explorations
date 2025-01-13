import { Camera, Color, Euler, Geometry, Mesh, Transform, Vec3 } from "ogl"
import { useMemo, useRef } from "react"
import { useFrame } from "react-ogl"

import { GLOBAL_GL } from "~/gl"
import { COLOR_FRAGMENT, COLOR_VERTEX } from "~/gl/programs/color-program"

const arrayEquals = (a: number[], b: number[]) => {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

/* Frustum Geometry */
const getFrustumBoxGeometry = (camera: Camera) => {
  const { near, far, top, bottom, left, right } = camera

  const geo = new Geometry(GLOBAL_GL, {
    position: {
      size: 3,
      /* Build a frustum box geometry */
      data: new Float32Array([
        0,
        0,
        0,
        /* ---- From camera to near plane ---- */
        +left,
        +bottom,
        -near,
        /*  */
        +left,
        +bottom,
        -near,
        +right,
        +bottom,
        -near,
        /*  */
        +right,
        +bottom,
        -near,
        0,
        0,
        0,
        0,
        0,
        0,
        /*  */
        +right,
        +top,
        -near,
        /*  */
        +right,
        +top,
        -near,
        +left,
        +top,
        -near,
        /*  */
        +left,
        +top,
        -near,
        +right,
        +bottom,
        -near,
        /*  */
        +right,
        +bottom,
        -near,
        +right,
        +top,
        -near,
        /*  */
        +right,
        +top,
        -near,
        +left,
        +bottom,
        -near,
        /*  */
        +left,
        +bottom,
        -near,
        +left,
        +top,
        -near,
        /*  */
        +left,
        +top,
        -near,
        0,
        0,
        0,
        /* ---- From near plane to far plane ---- */
        +left,
        +bottom,
        -near,
        +left,
        +bottom,
        -far,
        /*  */
        +left,
        +bottom,
        -far,
        +right,
        +bottom,
        -far,
        /*  */
        +right,
        +bottom,
        -far,
        +right,
        +bottom,
        -near,
        /*  */
        +right,
        +bottom,
        -near,
        +left,
        +bottom,
        -far,
        /*  */
        +left,
        +bottom,
        -far,
        +left,
        +top,
        -far,
        /*  */
        +left,
        +top,
        -far,
        +left,
        +top,
        -near,
        /*  */
        +left,
        +top,
        -near,
        +left,
        +bottom,
        -far,
        /*  */
        +left,
        +bottom,
        -far,
        +right,
        +top,
        -far,
        /*  */
        +right,
        +top,
        -far,
        +left,
        +top,
        -far,
        /*  */
        +left,
        +top,
        -far,
        +right,
        +bottom,
        -far,
        /*  */
        +right,
        +bottom,
        -far,
        +right,
        +top,
        -far,
        /*  */
        +right,
        +top,
        -far,
        +right,
        +bottom,
        -near,
        /*  */
        +right,
        +bottom,
        -near,
        +right,
        +top,
        -near,
        /*  */
        +right,
        +top,
        -near,
        +right,
        +top,
        -far,
        /*  */
        +right,
        +top,
        -far,
        +left,
        +top,
        -near
      ])
    },
    normal: {
      size: 3,
      data: new Float32Array([])
    }
  })

  return geo
}

export interface CameraHelperProps {
  camera: Camera
}

export const CameraHelper = ({ camera }: CameraHelperProps) => {
  const rootRef = useRef<Transform>()
  const geoRef = useRef<Mesh | null>(null)

  const refs = useRef({
    position: new Vec3(),
    rotation: new Euler(),
    near: 0,
    far: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  })

  useFrame(() => {
    // avoid creating the geometry if the camera has not changed
    if (
      camera.position.distance(refs.current.position) > 0 ||
      !arrayEquals(
        camera.rotation.toArray(),
        refs.current.rotation.toArray()
      ) ||
      camera.near !== refs.current.near ||
      camera.far !== refs.current.far ||
      camera.top !== refs.current.top ||
      camera.bottom !== refs.current.bottom ||
      camera.left !== refs.current.left ||
      camera.right !== refs.current.right
    ) {
      refs.current.position.copy(camera.position)
      refs.current.rotation.copy(camera.rotation)
      refs.current.near = camera.near
      refs.current.far = camera.far
      refs.current.top = camera.top
      refs.current.bottom = camera.bottom
      refs.current.left = camera.left
      refs.current.right = camera.right
    } else {
      return
    }

    rootRef.current?.position.copy(camera.position)
    rootRef.current?.rotation.copy(camera.rotation)
    rootRef.current?.updateMatrixWorld()
    if (geoRef.current) {
      geoRef.current.geometry = getFrustumBoxGeometry(camera)
      geoRef.current.updateMatrixWorld()
      geoRef.current.updateMatrix()
    }
  })

  const frustumGeo = useMemo(() => getFrustumBoxGeometry(camera), [camera])

  return (
    <transform ref={rootRef}>
      <mesh ref={geoRef} geometry={frustumGeo} mode={GLOBAL_GL.LINES}>
        <program
          vertex={COLOR_VERTEX}
          fragment={COLOR_FRAGMENT}
          uniforms={{
            uColor: { value: new Color(0xff0000) }
          }}
        />
      </mesh>
      <mesh>
        <plane args={[1, 1]} />
        <normalProgram />
      </mesh>
    </transform>
  )
}
