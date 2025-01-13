/*
  Since the quad does not make camera relative calcs to position the plane, we just need to make
  a rule of three calculation to convert the px to canvas units. No need to cam fov or zoom.
*/
export const pxToQuadCanvasUnits = (base: number, px: number) => {
  return (px * 2) / base
}

export const noScissor = (gl: WebGLRenderingContext, cb: () => void) => {
  gl.disable(gl.SCISSOR_TEST)
  cb()
  gl.enable(gl.SCISSOR_TEST)
}

export const canvasFit = (
  destWidth: number,
  destHeight: number,
  srcWidth: number,
  srcHeight: number,
  strategy: "cover" | "contain"
) => {
  const aspectRatio = srcWidth / srcHeight
  const canvasAspectRatio = destWidth / destHeight

  let drawWidth = destWidth
  let drawHeight = destHeight
  let drawX = 0
  let drawY = 0

  if (strategy === "cover") {
    /* cover */
    if (aspectRatio < canvasAspectRatio) {
      drawHeight = destWidth / aspectRatio
      drawY = (destHeight - drawHeight) / 2
    } else {
      drawWidth = destHeight * aspectRatio
      drawX = (destWidth - drawWidth) / 2
    }
  }

  if (strategy === "contain") {
    /* contain */
    if (aspectRatio < canvasAspectRatio) {
      drawWidth = destHeight * aspectRatio
      drawX = (destWidth - drawWidth) / 2
    } else {
      drawHeight = destWidth / aspectRatio
      drawY = (destHeight - drawHeight) / 2
    }
  }

  return {
    drawWidth,
    drawHeight,
    drawX,
    drawY
  }
}
