import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

const DynamicCanvas = dynamic(
  () => import("./page-canvas").then((mod) => mod.default),
  {
    ssr: false
  }
)

export function OglDynamicCanvas({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  if (!hydrated) return null
  return <DynamicCanvas>{children}</DynamicCanvas>
}
