"use client"

import { OglDynamicCanvas } from "~/gl/components/dynamic-canvas"

import { BackgroundGradient } from "./raymarch"

export default function Home() {
  return (
    <main className="">
      <OglDynamicCanvas>
        <BackgroundGradient />
      </OglDynamicCanvas>
    </main>
  )
}
