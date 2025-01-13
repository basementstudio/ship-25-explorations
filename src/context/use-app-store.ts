import { create } from "zustand"

// Extend this store if you need!

export interface AppStore {
  fontsLoaded: boolean
  /** True once the DOM is completly loaded and interactive */
  pageLoadedComplete: boolean
  highPriorityAnimationRunning: boolean
  reducedMotion: boolean
  isDebug: boolean
  setFontsLoaded: (fontsLoaded: boolean) => void
  setReducedMotion: (reducedMotion: boolean) => void
}

export const useAppStore = create<AppStore>((set) => {
  const store: AppStore = {
    pageLoadedComplete: false,
    fontsLoaded: false,
    highPriorityAnimationRunning: false,
    reducedMotion: false,
    isDebug: false,
    setFontsLoaded: (fontsLoaded: boolean) =>
      set((s) => ({ ...s, fontsLoaded })),
    setReducedMotion: (reducedMotion: boolean) =>
      set((s) => ({ ...s, reducedMotion }))
  }

  if (typeof window !== "undefined") {
    const url = new URL(document.location.href)

    const hasDebugParam = url.searchParams.has("debug")
    store.isDebug = hasDebugParam
  }

  return store
})
