"use client"

import dynamic from "next/dynamic"

import { WebGL } from "~/gl/tunnel"

const Scene = dynamic(() => import("./scene").then((mod) => mod.Scene), {
  ssr: false
})

export default function Home() {
  return (
    <main className="">
      <WebGL.In>
        <Scene />
      </WebGL.In>
    </main>
  )
}
