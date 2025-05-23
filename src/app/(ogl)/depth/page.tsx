"use client"

import { OglDynamicCanvas } from "~/gl/components/dynamic-canvas"

import { RaymarchShader } from "./raymarch"

export default function Home() {
  return (
    <main className="">
      <OglDynamicCanvas>
        <RaymarchShader />
      </OglDynamicCanvas>
    </main>
  )
}
