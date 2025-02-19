"use client"

import { OrbitControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"

import { Scene } from "./scene"

export default function Page() {
  return (
    <div className="grow relative w-full">
      <Canvas className="!absolute inset-0 w-full h-full">
        <Scene />
        <OrbitControls />
      </Canvas>
    </div>
  )
}
