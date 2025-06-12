"use client"

import { Color, OGLRenderingContext, Renderer } from "ogl"
import { create } from "zustand"

import { GLOBAL_GL, GLOBAL_RENDERER } from ".."
import { DEFAULT_CLEAR_COLOR } from "../constants"

export type CameraName = "main" | "debug-orbit" | "custom"

export interface GlControls {
  renderer: Renderer
  gl: OGLRenderingContext
  activeCamera: CameraName | null
  scrollerContainer: HTMLDivElement | null
  canvasElement: HTMLCanvasElement | null
  setActiveCamera: (camera: CameraName | null) => void
  aspect: number
  hasRendered: boolean
  setHasRendered: () => void
  glBackground: Color
}

/** A global store for rendering controls */
export const useGlControls = create<GlControls>((set) => {
  const gl = GLOBAL_GL
  if (!gl) return {} as any

  const state: GlControls = {
    renderer: GLOBAL_RENDERER,
    gl,
    activeCamera: "main",
    scrollerContainer: null,
    canvasElement: null,
    aspect: 1,
    hasRendered: false,
    glBackground: DEFAULT_CLEAR_COLOR,
    setHasRendered: () => {
      set({ hasRendered: true })
    },
    setActiveCamera: (camera) => {
      set({ activeCamera: camera })
    }
  }

  return state
})
