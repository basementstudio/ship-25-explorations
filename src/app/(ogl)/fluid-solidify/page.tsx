"use client"

import { WebGL } from "~/gl/tunnel"

import { RaymarchShader } from "./raymarch"

export default function Home() {
  return (
    <main className="">
      <WebGL.In>
        <RaymarchShader />
      </WebGL.In>
    </main>
  )
}
