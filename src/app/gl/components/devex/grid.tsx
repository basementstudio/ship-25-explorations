import { GridHelper } from "ogl"
import { useMemo } from "react"
import { useOGL } from "react-ogl"

interface GridProps {
  size: number
  divisions: number
}

export const Grid = ({ divisions, size }: GridProps) => {
  const gl = useOGL((s) => s.gl)
  const helper = useMemo(
    () =>
      new GridHelper(gl, {
        divisions,
        size
      }),
    [gl, divisions, size]
  )
  return <primitive object={helper} />
}
