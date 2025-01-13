"use client"

/**
 * File based on react-ogl canvas.
 * We modified this to allow us to provide the gl, renderer and canvas from a global scope.
 * https://github.com/pmndrs/react-ogl/blob/main/src/Canvas.tsx
 * */

import { FiberProvider, useContextBridge } from "its-fine"
import { OGLRenderingContext } from "ogl"
import * as React from "react"
import {
  Block,
  ErrorBoundary,
  events as defaultEvents,
  render,
  RenderProps,
  SetBlock,
  unmountComponentAtNode
} from "react-ogl"

import useMeasure, { Options as ResizeOptions } from "~/hooks/use-measure"
import { isClient } from "~/lib/constants"

import { useGlControls } from "./hooks/use-gl-controls"

export interface CanvasProps
  extends Omit<RenderProps, "size">,
    React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gl: OGLRenderingContext
  resize?: ResizeOptions
}

const CLEAR_ON_UNMOUNT = false

const CanvasImpl = React.forwardRef<HTMLCanvasElement, CanvasProps>(
  function Canvas(
    {
      resize,
      children,
      style,
      renderer,
      dpr,
      camera,
      orthographic,
      frameloop,
      events = defaultEvents,
      onCreated,
      gl,
      ...props
    },
    forwardedRef
  ) {
    const Bridge = useContextBridge()
    const canvasRef = React.useRef<HTMLCanvasElement>(gl.canvas)
    const [canvas] = React.useState<HTMLCanvasElement>(gl.canvas)
    const [div, { width, height }] = useMeasure({
      scroll: true,
      debounce: { scroll: 50, resize: 0 },
      ...resize
    })

    const [block, setBlock] = React.useState<SetBlock>(false)
    const [error, setError] = React.useState(false)

    React.useImperativeHandle(forwardedRef, () => canvasRef.current!)

    // Suspend this component if block is a promise (2nd run)
    if (block) throw block
    // Throw exception outwards if anything within Canvas throws
    if (error) throw error

    // Render to screen
    if (canvas && width > 0 && height > 0 && isClient) {
      render(
        <Bridge>
          <ErrorBoundary set={setError}>
            <React.Suspense fallback={<Block set={setBlock} />}>
              {children}
            </React.Suspense>
          </ErrorBoundary>
        </Bridge>,
        canvas,
        {
          size: { width, height },
          orthographic,
          frameloop,
          renderer,
          dpr,
          camera,
          events,
          onCreated
        }
      )
    }

    const containerRef = React.useRef<HTMLDivElement | null>(null)

    React.useEffect(() => {
      useGlControls.setState({ canvasElement: canvas })
    }, [canvas])

    React.useEffect(() => {
      const containerDiv = containerRef.current

      if (!containerDiv) return

      // add canvas to dom
      canvasRef.current.style.display = "block"
      canvasRef.current.style.background = "transparent"
      containerDiv.appendChild(canvasRef.current)

      return () => {
        // clear canvas and unmount

        if (CLEAR_ON_UNMOUNT) {
          gl.clearColor(0, 0, 0, 1)
          gl.clear(gl.DEPTH_BUFFER_BIT)
          gl.clear(gl.COLOR_BUFFER_BIT)
          gl.clear(gl.ACTIVE_TEXTURE)
          gl.getParameter(gl.COLOR_CLEAR_VALUE)
          gl.getParameter(gl.DEPTH_CLEAR_VALUE)
          gl.getParameter(gl.STENCIL_CLEAR_VALUE)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
        unmountComponentAtNode(canvasRef.current)
      }
    }, [containerRef, gl, renderer])

    return (
      <div
        {...props}
        ref={(r) => {
          div(r)
          containerRef.current = r
        }}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          ...style
        }}
      />
    )
  }
)

/**
 * A resizeable canvas whose children are declarative OGL elements.
 */
export const BasementCanvas = React.forwardRef<HTMLCanvasElement, CanvasProps>(
  function CanvasWrapper(props, ref) {
    return (
      <FiberProvider>
        {/*
            We are forcing dpr 1 because all our scene is blured and a higher dpr has no impact on the quality.
          */}
        <CanvasImpl {...props} dpr={1} ref={ref} />
      </FiberProvider>
    )
  }
)
