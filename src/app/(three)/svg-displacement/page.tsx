"use client"

import { Canvas } from "@react-three/fiber"

import { Scene } from "./scene"
import { Form } from "./form"

export default function Page() {
  return (
    <div className="grow relative w-full">
      <Form />
    </div>
  )
}
