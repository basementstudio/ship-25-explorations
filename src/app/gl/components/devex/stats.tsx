import { useEffect } from "react"
import { useFrame } from "react-ogl"
import StatsJS from "stats.js"

const stats = new StatsJS()

export const Stats = () => {
  useEffect(() => {
    stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom)

    return () => {
      document.body.removeChild(stats.dom)
    }
  }, [])

  useFrame(() => {
    stats.end()
    stats.begin()
  })

  return <></>
}
