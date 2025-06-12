import { useControls } from "leva"
import { useEffect, useMemo } from "react"

import { CameraName, useGlControls } from "~/gl/hooks/use-gl-controls"
import { useToggleControl } from "~/gl/hooks/use-toggle-control"
import { HtmlIn } from "~/gl/tunnel"
import { useDevice } from "~/hooks/use-device"
import { useMousetrap } from "~/hooks/use-mousetrap"

import { Grid } from "./grid"
import { OrbitHelper } from "./orbit"
import { Stats } from "./stats"

const cameraOptions = [
  "main",
  "debug-orbit",
  "custom"
] as const satisfies CameraName[]

/** Adds all the scene helpers */
export const Helpers = () => {
  const [gridHelper] = useToggleControl({
    folder: "Helpers",
    key: "gridHelper",
    label: "Grid",
    shortcut: "g",
    defaultValue: false
  })

  const [showStats] = useToggleControl({
    folder: "Helpers",
    key: "showStats",
    label: "Stats",
    shortcut: "t",
    defaultValue: false
  })

  const [showDeviceData] = useToggleControl({
    folder: "Helpers",
    key: "showDeviceData",
    label: "Device data",
    shortcut: "d",
    defaultValue: false
  })

  const activeCamera = useGlControls((s) => s.activeCamera)
  const [, setCamera] = useControls(() => ({
    camera: {
      label: "Camera (C)",
      value: "main", // controlled
      options: {
        "Main (M)": "main",
        "Orbit (O)": "debug-orbit"
      },
      onChange: (value: CameraName) => {
        useGlControls.setState({
          activeCamera: value
        })
      },
      transient: false
    }
  }))

  useEffect(() => {
    if (!activeCamera) return
    setCamera({
      camera: activeCamera
    })
  }, [activeCamera, setCamera])

  useMousetrap([
    {
      keys: "c",
      callback: () => {
        const currentCameraIndex = cameraOptions.indexOf(
          useGlControls.getState().activeCamera as CameraName
        )

        if (currentCameraIndex === -1) {
          useGlControls.setState({ activeCamera: "main" })
          return
        }

        const nextCamera =
          cameraOptions[(currentCameraIndex + 1) % cameraOptions.length]
        useGlControls.setState({ activeCamera: nextCamera })
      }
    },
    {
      keys: "m",
      callback: () => {
        useGlControls.setState({ activeCamera: "main" })
      }
    },
    {
      keys: "o",
      callback: () => {
        useGlControls.setState({ activeCamera: "debug-orbit" })
      }
    }
  ])

  const deviceData = useDevice()

  const stringVersion = useMemo(
    () => JSON.stringify(deviceData, null, 3).split("\n"),
    [deviceData]
  )

  return (
    <>
      <OrbitHelper />
      {gridHelper && <Grid size={20} divisions={20} />}
      {showStats && <Stats />}
      {showDeviceData && (
        <HtmlIn>
          <div
            data-lenis-prevent
            className="fixed p-4 overflow-y-auto font-mono text-white bg-black/80 left-4 max-w-96 inset-y-4 z-debug"
          >
            {stringVersion.map((line, i) => (
              <div className="whitespace-pre" key={i}>
                {line}
              </div>
            ))}
          </div>
        </HtmlIn>
      )}
    </>
  )
}
