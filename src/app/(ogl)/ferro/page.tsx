"use client"

import dynamic from "next/dynamic"

import { OglDynamicCanvas } from "~/gl/components/dynamic-canvas"

const Scene = dynamic(() => import("./scene").then((mod) => mod.Scene), {
  ssr: false
})

export default function Home() {
  return (
    <main className="">
      <OglDynamicCanvas>
        <Scene />
      </OglDynamicCanvas>
    </main>
  )
}
