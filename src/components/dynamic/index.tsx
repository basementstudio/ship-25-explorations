"use client"

import React, { memo, useEffect, useState } from "react"

import { useDocumentReady } from "~/hooks/use-document-load"

interface ImportOptions {
  placholder?: React.ComponentType
}

type ImportFunction = () => Promise<{ default: React.ComponentType<any> }>

export function importAfterInteractive<P = {}>(
  importFunction: ImportFunction,
  options: ImportOptions = {}
) {
  return memo((props: P) => {
    const pageReady = useDocumentReady()

    const [Component, setComponent] = useState<React.ComponentType<P> | null>(
      null
    )

    useEffect(() => {
      if (!pageReady) return

      const abortController = new AbortController()
      const signal = abortController.signal

      importFunction().then((module) => {
        if (signal.aborted) return
        setComponent(() => module.default)
      })

      return () => {
        abortController.abort()
      }
    }, [pageReady])

    if (!Component) {
      return options.placholder ? <options.placholder /> : null
    }

    return <Component {...(props as any)} />
  })
}
