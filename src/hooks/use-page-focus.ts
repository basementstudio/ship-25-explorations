import { useEffect, useState } from "react"

export function usePageVisibility(): boolean {
  const [isPageVisible, setIsPageVisible] = useState(true)

  useEffect(() => {
    const handleFocus = (): void => setIsPageVisible(true)
    const handleBlur = (): void => setIsPageVisible(false)

    window.addEventListener("focus", handleFocus)
    window.addEventListener("blur", handleBlur)

    return () => {
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("blur", handleBlur)
    }
  }, [])

  return isPageVisible
}
