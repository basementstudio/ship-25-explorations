"use client"

import { WebGL } from "~/gl/tunnel"

import { BackgroundGradient } from "./raymarch"

export default function Home() {
  return (
    <main className="flex min-h-screen z-over-canvas relative">
      <WebGL.In>
        <BackgroundGradient />
      </WebGL.In>
    </main>
  )
}
