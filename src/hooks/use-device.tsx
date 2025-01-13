"use client"

import type { TierResult } from "detect-gpu"
import { memo, useEffect } from "react"
import { create } from "zustand"

import { useBattery } from "./use-battery"
import { useMedia } from "./use-media"

export interface DeviceType {
  browserName: string
  browserVersion: string
  deviceType: string
  engineName: string
  engineVersion: string
  fullBrowserVersion: string
  getUA: string
  isAndroid: boolean
  isBrowser: boolean
  isChrome: boolean
  isChromium: boolean
  isConsole: boolean
  isDesktop: boolean
  isEdge: boolean
  isEdgeChromium: boolean
  isElectron: boolean
  isEmbedded: boolean
  isFirefox: boolean
  isIE: boolean
  isIOS: boolean
  isIOS13: boolean
  isIPad13: boolean
  isIPhone13: boolean
  isIPod13: boolean
  isLegacyEdge: boolean
  isMIUI: boolean
  isMacOs: boolean
  isMobile: boolean
  isMobileOnly: boolean
  isMobileSafari: boolean
  isOpera: boolean
  isSafari: boolean
  isSamsungBrowser: boolean
  isSmartTV: boolean
  isTablet: boolean
  isWearable: boolean
  isWinPhone: boolean
  isWindows: boolean
  isYandex: boolean
  mobileModel: string
  mobileVendor: string
  osName: string
  osVersion: string
}

interface Battery {
  charging: boolean
  level: number
}

interface UseDeviceStore {
  reduceMotion: boolean
  device: DeviceType | null
  gpu: TierResult | null
  battery: Battery | null
}

export const useDevice = create<UseDeviceStore>(() => ({
  reduceMotion: false,
  device: null,
  gpu: null,
  battery: null
}))

export function getCanUseWebGl(
  deviceData: DeviceType,
  gpuData: TierResult,
  batteryData: Battery | null,
  reducedMotion: boolean
): boolean {
  if (deviceData.isMobile) {
    return false
  }

  if (reducedMotion) return false

  if (gpuData.tier < 1) {
    return Boolean(gpuData.gpu?.includes("apple"))
  }

  if (batteryData) {
    if (batteryData.level < 0.07) {
      // no enough battery
      return false
    }
    if (batteryData.level < 0.1 && !batteryData.charging) {
      return false
    }
  }

  return true
}

// this hook will save the device information in the store
export const DeviceDetector = memo(function MemoDetector() {
  const battery = useBattery()

  const reducedMotion = useMedia("(prefers-reduced-motion: reduce)", false)

  useEffect(() => {
    useDevice.setState({
      reduceMotion: reducedMotion
    })
  }, [reducedMotion])

  useEffect(() => {
    if (battery.isSupported && battery.fetched) {
      useDevice.setState({
        battery: {
          charging: battery.charging,
          level: battery.level
        }
      })
    }
  }, [battery])

  useEffect(() => {
    if (typeof window === "undefined") return
    const abortController = new AbortController()
    const signal = abortController.signal

    import("react-device-detect").then((module) => {
      if (signal.aborted) return

      const newState = module.getSelectorsByUserAgent(
        navigator.userAgent
      ) as DeviceType

      useDevice.setState({
        device: newState
      })
    })

    import("detect-gpu").then(({ getGPUTier }) => {
      if (signal.aborted) return

      getGPUTier().then((gpu) => {
        if (signal.aborted) return
        useDevice.setState({
          gpu
        })
      })
    })

    return () => {
      abortController.abort()
    }
  }, [])

  return null
})
