"use client"

import { isEqual } from "lodash-es"
import { useEffect, useState } from "react"

import { useStateToRef } from "./use-state-to-ref"

// misc

function on<T extends Window | Document | HTMLElement | EventTarget>(
  obj: T | null,
  ...args: Parameters<T["addEventListener"]> | [string, Function | null, ...any]
): void {
  if (obj && obj.addEventListener) {
    obj.addEventListener(
      ...(args as Parameters<HTMLElement["addEventListener"]>)
    )
  }
}

function off<T extends Window | Document | HTMLElement | EventTarget>(
  obj: T | null,
  ...args:
    | Parameters<T["removeEventListener"]>
    | [string, Function | null, ...any]
): void {
  if (obj && obj.removeEventListener) {
    obj.removeEventListener(
      ...(args as Parameters<HTMLElement["removeEventListener"]>)
    )
  }
}

const isNavigator = typeof navigator !== "undefined"

// hook

export interface BatteryState {
  charging: boolean
  chargingTime: number
  dischargingTime: number
  level: number
}

interface BatteryManager extends Readonly<BatteryState>, EventTarget {
  onchargingchange: () => void
  onchargingtimechange: () => void
  ondischargingtimechange: () => void
  onlevelchange: () => void
}

interface NavigatorWithPossibleBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>
}

type UseBatteryState =
  | { isSupported: false } // Battery API is not supported
  | { isSupported: true; fetched: false } // battery API supported but not fetched yet
  | (BatteryState & { isSupported: true; fetched: true }) // battery API supported and fetched

const nav: NavigatorWithPossibleBattery | undefined = isNavigator
  ? navigator
  : undefined
const isBatteryApiSupported = nav && typeof nav.getBattery === "function"

function useBatteryMock(): UseBatteryState {
  return { isSupported: false }
}

function useBatteryReal(): UseBatteryState {
  const [state, setState] = useState<UseBatteryState>({
    isSupported: true,
    fetched: false
  })

  const stateRef = useStateToRef(state)

  useEffect(() => {
    let isMounted = true
    let battery: BatteryManager | null = null

    const handleChange = (): void => {
      if (!isMounted || !battery) {
        return
      }
      const newState: UseBatteryState = {
        isSupported: true,
        fetched: true,
        level: battery.level,
        charging: battery.charging,
        dischargingTime: battery.dischargingTime,
        chargingTime: battery.chargingTime
      }
      if (!isEqual(stateRef.current, newState)) {
        setState(newState)
      }
    }

    nav!.getBattery!().then((bat: BatteryManager) => {
      if (!isMounted) {
        return
      }
      battery = bat
      on(battery, "chargingchange", handleChange)
      on(battery, "chargingtimechange", handleChange)
      on(battery, "dischargingtimechange", handleChange)
      on(battery, "levelchange", handleChange)
      handleChange()
    })

    return () => {
      isMounted = false
      if (battery) {
        off(battery, "chargingchange", handleChange)
        off(battery, "chargingtimechange", handleChange)
        off(battery, "dischargingtimechange", handleChange)
        off(battery, "levelchange", handleChange)
      }
    }
  }, [stateRef])

  return state
}

export const useBattery = isBatteryApiSupported
  ? useBatteryReal
  : useBatteryMock
