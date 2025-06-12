import { useEffect } from "react"

import { subscribable } from "~/lib/subscribable"

import { useStateToRef } from "./use-state-to-ref"

type MouseMoveCallback = (e: PointerEvent) => void

const mouseMoveSubscribable = subscribable<MouseMoveCallback>()

export function useMouseMove(callback: MouseMoveCallback) {
  const callbackRef = useStateToRef<MouseMoveCallback>(callback)

  useEffect(() => {
    const cId = mouseMoveSubscribable.addCallback((e) => {
      ; (callbackRef.current as MouseMoveCallback)(e)
    })

    return () => {
      mouseMoveSubscribable.removeCallback(cId)
    }
  }, [])
}

/** This should be used only once in the entire app */
export function useGlobalMouseCallback() {
  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    window.addEventListener(
      "pointermove",
      (e) => {
        mouseMoveSubscribable.runCallbacks(e)
      },
      { signal }
    )

    return () => {
      controller.abort()
    }
  }, [])
}
