import { useEffect, useState } from "react"

export const useMedia = <T = boolean | undefined>(
  mediaQuery: string,
  initialValue?: T
): T | boolean => {
  const [isVerified, setIsVerified] = useState<T>(initialValue as T)

  useEffect(() => {
    if (!isApiSupported("matchMedia")) {
      // eslint-disable-next-line no-console
      console.warn("matchMedia is not supported by your current browser")
      return
    }
    const mediaQueryList = window.matchMedia(mediaQuery)
    const changeHandler = (): void =>
      setIsVerified(Boolean(mediaQueryList.matches) as T)

    changeHandler()
    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", changeHandler)
      return () => {
        mediaQueryList.removeEventListener("change", changeHandler)
      }
    } else if (typeof mediaQueryList.addListener === "function") {
      mediaQueryList.addListener(changeHandler)
      return () => {
        mediaQueryList.removeListener(changeHandler)
      }
    }
  }, [mediaQuery])

  return isVerified
}

export const isClient = typeof document !== "undefined"

const isApiSupported = (api: string): boolean => isClient && api in window
