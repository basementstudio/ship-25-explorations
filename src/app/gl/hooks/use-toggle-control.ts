import { folder as levaFolder, useControls } from "leva"
import { useMemo } from "react"

import { useMousetrap } from "~/hooks/use-mousetrap"

export interface useToggleControlParams {
  key: string
  folder?: string
  label?: string
  shortcut?: string
  defaultValue?: boolean
  onChange?: (value: boolean) => void
}

const parseShortcut = (shortcut: string) =>
  shortcut.toUpperCase().replace("SHIFT+", "⬆")

export const useToggleControl = ({
  folder,
  key,
  label,
  shortcut,
  defaultValue,
  onChange
}: useToggleControlParams) => {
  const controlLabel = `${typeof label === "string" ? label : key}${typeof shortcut === "string" ? ` (${parseShortcut(shortcut)})` : ""}`

  const [values, set] = useControls(() => {
    const config = {
      [key]: {
        label: controlLabel,
        folder: folder,
        value: typeof defaultValue === "boolean" ? defaultValue : false,
        onChange: (value: boolean) => {
          if (onChange) {
            onChange(value)
          }
        },
        transient: false
      }
    } as const

    if (typeof folder === "string") {
      return {
        [folder]: levaFolder(config)
      } as const
    }

    return config
  })

  if (shortcut) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMousetrap([
      {
        keys: shortcut,
        callback: () => {
          set({ [key]: !values[key] })
        }
      }
    ])
  }

  const setValue = useMemo(
    () => (value: boolean) => {
      set({ [key]: value })
    },
    [key, set]
  )

  const currentValue = values[key]

  return [currentValue, setValue] as const
}
