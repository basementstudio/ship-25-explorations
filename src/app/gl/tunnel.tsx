"use client"

import { Fragment, useEffect, useId, useState } from "react"
import tunnel from "tunnel-rat"

import { useAppStore } from "~/context/use-app-store"

const _WebGL = tunnel()

const OriginalIn = _WebGL.In

const WebGLIn = ({
  id,
  lazy = true,
  children,
  ...props
}: React.ComponentProps<typeof _WebGL.In> & {
  id?: string | number
  lazy?: boolean
}) => {
  const componentId = useId()

  const [mounted, setMounted] = useState(lazy ? false : true)
  /* We should mount WebGL ONLY if highPriority animations are NOT running */
  const highPriorityAnimationRunning = useAppStore(
    (s) => s.highPriorityAnimationRunning
  )

  useEffect(() => {
    if (!mounted && !highPriorityAnimationRunning && lazy) {
      setMounted(true)
    }
  }, [highPriorityAnimationRunning, lazy, mounted])

  if (typeof id === "string") {
    return (
      <OriginalIn {...props} key={id}>
        {children}
      </OriginalIn>
    )
  }

  return (
    <OriginalIn {...props}>
      {mounted ? <Fragment key={componentId}>{children}</Fragment> : null}
    </OriginalIn>
  )
}

export const WebGL = {
  Out: _WebGL.Out,
  In: WebGLIn
}

const _Html = tunnel()

const OriginalHtmlIn = _Html.In

export const HtmlIn = ({
  lazy = true,
  ...props
}: React.ComponentProps<typeof _Html.In> & { lazy?: boolean }) => {
  const id = useId()
  const [mounted, setMounted] = useState(lazy ? false : true)
  /* We should mount WebGL ONLY if highPriority animations are NOT running */
  const highPriorityAnimationRunning = useAppStore(
    (s) => s.highPriorityAnimationRunning
  )

  useEffect(() => {
    if (!mounted && !highPriorityAnimationRunning && lazy) {
      setMounted(true)
    }
  }, [highPriorityAnimationRunning, lazy, mounted])

  return (
    <OriginalHtmlIn {...props}>
      {mounted ? <Fragment key={id}>{props.children}</Fragment> : null}
    </OriginalHtmlIn>
  )
}

export const HtmlOut = _Html.Out
