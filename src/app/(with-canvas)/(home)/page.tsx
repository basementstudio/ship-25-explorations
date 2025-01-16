"use client"

import { WebGL } from "~/gl/tunnel"

import { BackgroundGradient } from "./raymarch"

export default function Home() {
  return (
    <main className="">
      <WebGL.In>
        <BackgroundGradient />
      </WebGL.In>
    </main>
  )
}
