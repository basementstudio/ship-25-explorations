"use client"

import { Canvas } from "@react-three/fiber"

import { Scene } from "./scene"

export default function Page() {
  return (
    <div className="grow relative w-full">
      <Canvas dpr={[1, 1.5]} className="!absolute top-0 left-0 !w-full !h-full">
        <Scene />
      </Canvas>
    </div>
  )
}
