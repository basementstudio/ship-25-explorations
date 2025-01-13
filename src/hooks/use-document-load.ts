"use client"

import { useEffect, useState } from "react"

import { useAppStore } from "~/context/use-app-store"
import { subscribable } from "~/lib/subscribable"

const pageLoadedSubscribable = subscribable()

export function useSyncDocumentLoad() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (typeof document === "undefined") return

    if (document.readyState === "complete") {
      setLoaded(true)
      return
    }

    const loadCb = () => {
      if (document.readyState === "complete") {
        setLoaded(true)
      }
    }

    document.addEventListener("readystatechange", loadCb)

    return () => {
      document.removeEventListener("readystatechange", loadCb)
    }
  }, [])

  useEffect(() => {
    if (!loaded) return

    /* Run all already added */
    pageLoadedSubscribable.runCallbacks()
  }, [loaded])

  useEffect(() => {
    useAppStore.setState({ pageLoadedComplete: loaded })
  }, [loaded])
}

export const useDocumentLoadCallback = (
  _callback: () => void | (() => void),
  args: any[] = []
) => {
  useEffect(() => {
    let cbClearFn: (() => void) | undefined
    let callbackid: string | undefined

    const callbackWrapper = () => {
      cbClearFn = _callback() ?? undefined
      // remove callback after it's run
      if (callbackid) {
        pageLoadedSubscribable.removeCallback(callbackid)
      }
    }

    callbackid = pageLoadedSubscribable.addCallback(callbackWrapper)

    return () => {
      if (callbackid) {
        pageLoadedSubscribable.removeCallback(callbackid)
      }
      cbClearFn?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, args)
}

export const useDocumentReady = () => {
  const ready = useAppStore((s) => s.pageLoadedComplete)

  return ready
}
