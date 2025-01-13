import { useEffect } from "react"
import { RefObject } from "react"
import { useRef } from "react"

export function useStateToRef<T>(state: T): RefObject<T> {
  const ref = useRef<T>(state)
  useEffect(() => {
    ref.current = state
  }, [state])
  return ref
}
