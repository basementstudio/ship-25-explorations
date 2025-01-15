"use client"

import { WebGL } from "~/gl/tunnel"

import { RaymarchShader } from "./raymarch"

export default function Home() {
  return (
    <main className="flex min-h-screen z-over-canvas relative">
      <WebGL.In>
        <RaymarchShader />
      </WebGL.In>
    </main>
  )
}
