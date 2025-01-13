import { Camera } from "ogl"

import { degToRad } from "./utils/math"

class CameraControls {
  camera: Camera

  constructor(camera: Camera) {
    this.camera = camera
  }

  getDistanceToFitBox = (
    width: number,
    height: number,
    depth: number,
    cover = false
  ) => {
    if (this.camera.type === "orthographic") {
      throw new Error(
        "getDistanceToFitBox is not implemented for orthographic cameras"
      )
    }

    const boundingRectAspect = width / height
    /* Warning! This doesn't take zoom in account */
    const fov = degToRad(this.camera.fov)
    const aspect = this.camera.aspect

    const heightToFit = (
      cover ? boundingRectAspect > aspect : boundingRectAspect < aspect
    )
      ? height
      : width / aspect
    return (heightToFit * 0.5) / Math.tan(fov * 0.5) + depth * 0.5
  }
}

export { CameraControls }
