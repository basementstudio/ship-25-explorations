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

/* Perspective Frustum Geometry */
const getPerspectiveFrustumBoxGeometry = (camera: Camera) => {
  const { near, far, fov, aspect } = camera

  // Compute near plane bounds
  const nearTop = near * Math.tan((fov * Math.PI) / 360)
  const nearBottom = -nearTop
  const nearRight = nearTop * aspect
  const nearLeft = -nearRight

  // Compute far plane bounds
  const farTop = far * Math.tan((fov * Math.PI) / 360)
  const farBottom = -farTop
  const farRight = farTop * aspect
  const farLeft = -farRight

  const geo = new Geometry(GLOBAL_GL, {
    position: {
      size: 3,
      /* Build a perspective frustum box geometry */
      data: new Float32Array([
        // Near plane
        nearLeft,
        nearBottom,
        -near,
        nearRight,
        nearBottom,
        -near,
        nearRight,
        nearBottom,
        -near,
        nearRight,
        nearTop,
        -near,
        nearRight,
        nearTop,
        -near,
        nearLeft,
        nearTop,
        -near,
        nearLeft,
        nearTop,
        -near,
        nearLeft,
        nearBottom,
        -near,

        // Far plane
        farLeft,
        farBottom,
        -far,
        farRight,
        farBottom,
        -far,
        farRight,
        farBottom,
        -far,
        farRight,
        farTop,
        -far,
        farRight,
        farTop,
        -far,
        farLeft,
        farTop,
        -far,
        farLeft,
        farTop,
        -far,
        farLeft,
        farBottom,
        -far,

        // Connect near and far planes
        nearLeft,
        nearBottom,
        -near,
        farLeft,
        farBottom,
        -far,
        nearRight,
        nearBottom,
        -near,
        farRight,
        farBottom,
        -far,
        nearRight,
        nearTop,
        -near,
        farRight,
        farTop,
        -far,
        nearLeft,
        nearTop,
        -near,
        farLeft,
        farTop,
        -far
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

export const CameraFrustumHelper = ({ camera }: CameraHelperProps) => {
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
    right: 0,
    fov: 0
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
      camera.right !== refs.current.right ||
      camera.fov !== refs.current.fov
    ) {
      refs.current.position.copy(camera.position)
      refs.current.rotation.copy(camera.rotation)
      refs.current.near = camera.near
      refs.current.far = camera.far
      refs.current.top = camera.top
      refs.current.bottom = camera.bottom
      refs.current.left = camera.left
      refs.current.right = camera.right
      refs.current.fov = camera.fov
    } else {
      return
    }

    rootRef.current?.position.copy(camera.position)
    rootRef.current?.rotation.copy(camera.rotation)
    rootRef.current?.updateMatrixWorld()
    if (geoRef.current) {
      if (camera.fov > 0) {
        geoRef.current.geometry = getPerspectiveFrustumBoxGeometry(camera)
      } else {
        geoRef.current.geometry = getFrustumBoxGeometry(camera)
      }
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
