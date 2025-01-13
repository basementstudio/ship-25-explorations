"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useEffect } from "react"
import { useMedia } from "react-use"

import { useAppStore } from "~/context/use-app-store"
import { DeviceDetector } from "~/hooks/use-device"
import { useSyncDocumentLoad } from "~/hooks/use-document-load"
import { basementLog, isClient, isProd } from "~/lib/constants"

gsap.registerPlugin(useGSAP)

export const AppHooks = () => {
  if (isProd && isClient) {
    // eslint-disable-next-line no-console
    console.log(basementLog)
  }

  useSyncDocumentLoad()
  useSyncReducedMotion()
  useRegisterOverflowDebuggerInDev()
  useSyncFontsLoaded()

  return (
    <>
      <DeviceDetector />
    </>
  )
}

/* APP HOOKS */

const useSyncReducedMotion = () => {
  const reducedMotion = useMedia("(prefers-reduced-motion: reduce)", false)
  useEffect(() => {
    if (reducedMotion === undefined) return
    useAppStore.setState({ reducedMotion })
  }, [reducedMotion])
}

const useRegisterOverflowDebuggerInDev = () => {
  const isDebug = useAppStore((s) => s.isDebug)
  useEffect(() => {
    if (!isDebug) return
    let mousetrapRef: Mousetrap.MousetrapInstance | undefined = undefined
    import("mousetrap").then(({ default: mousetrap }) => {
      mousetrapRef = mousetrap.bind(["command+i", "ctrl+i", "alt+i"], () => {
        document.body.classList.toggle("inspect")
      })
    })

    return () => {
      mousetrapRef?.unbind(["command+i", "ctrl+i", "alt+i"])
    }
  }, [isDebug])
}

const useSyncFontsLoaded = () => {
  useEffect(() => {
    const maxWaitTime = 1500 // tweak this as needed.

    const timeout = window.setTimeout(() => {
      onReady()
    }, maxWaitTime)

    function onReady() {
      window.clearTimeout(timeout)
      useAppStore.setState({ fontsLoaded: true })
      document.documentElement.classList.add("fonts-loaded")
    }

    try {
      document.fonts.ready
        .then(() => {
          onReady()
        })
        .catch((error: unknown) => {
          console.error(error)
          onReady()
        })
    } catch (error) {
      console.error(error)
      onReady()
    }
  }, [])
}
