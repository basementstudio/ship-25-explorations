"use client"

import { folder as levaFolder, useControls } from "leva"

import BACKGROUND_GRADIENT_FRAGMENT from "./background-gradient.frag"
import BACKGROUND_GRADIENT_VERTEX from "./background-gradient.vert"

// Avoid re-creating the arrays on every render by defining them outside of the component
const positionData = new Float32Array([-1, 1, 0, -1, -1, 0, 1, 1, 0, 1, -1, 0])
const uvData = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0])
const indexData = new Uint16Array([0, 1, 2, 1, 3, 2])

export function BackgroundGradient() {
  const [uniforms] = useControls(() => ({
    "Background Gradient": levaFolder(
      {
        uColor1: "#601a80",
        uColor2: "#ff4d00",
        uColor3: "#000000",
        uColor4: "#ff4d00",
        uColorAccent: "#000000",
        uLinesAmount: { max: 55, min: 40, value: 50 },
        uMaskRadius: { max: 2, min: 0.2, value: 1.69 },
        uMaskPositionX: { min: -1, max: 1, value: 0.75 },
        uMaskPositionY: { min: -1, max: 1, value: -0.6 }
      },
      {
        collapsed: false
      }
    )
  }))

  return (
    <mesh>
      <geometry
        position={{
          size: 3,
          data: positionData
        }}
        uv={{ size: 2, data: uvData }}
        index={{ data: indexData }}
      />
      <program
        vertex={BACKGROUND_GRADIENT_VERTEX}
        fragment={BACKGROUND_GRADIENT_FRAGMENT}
        uniforms={{
          uColor1: uniforms.uColor1,
          uColor2: uniforms.uColor2,
          uColor3: uniforms.uColor3,
          uColor4: uniforms.uColor4,
          uColor1Size: 0.16,
          uColor2Size: 0.62,
          uColor3Size: 0.68,
          uColor4Size: 1.0,
          uMaskRadius: uniforms.uMaskRadius,
          uMaskSmoothness: 1.0,
          uMaskInvert: 0,
          uMaskPositionX: uniforms.uMaskPositionX,
          uMaskPositionY: uniforms.uMaskPositionY,
          uColorAccent: uniforms.uColorAccent,
          uLinesBlur: 0.35,
          uNoise: 0.0435,
          uOffsetX: 0.34,
          uOffsetY: 0.0,
          uLinesAmount: uniforms.uLinesAmount,
          uPlaneRes: [100, 100],
          uMouse2D: [0, 0],
          uBackgroundScale: 1.0
        }}
      />
    </mesh>
  )
}
