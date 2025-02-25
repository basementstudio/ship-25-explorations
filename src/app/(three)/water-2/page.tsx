"use client"

import { Canvas } from "@react-three/fiber"

import { Scene } from "./scene"
import { eventManagerFactory } from "./scene/event-manager"

export default function Page() {
  return (
    <div className="grow relative w-full">
      <Canvas
        events={eventManagerFactory}
        dpr={[1, 1.5]}
        className="!absolute top-0 left-0 !w-full !h-full"
      >
        <Scene />
      </Canvas>
    </div>
  )
}
