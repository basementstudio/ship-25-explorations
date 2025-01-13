"use client"

import { importAfterInteractive } from "~/components/dynamic"

/**
 * This import will only run once the page is interactive, improving the lighthouse score.
 * If your LCP depends on a 3D effect, you should either add a static image while the component loads,
 * or import the page canvas normally so it's loaded as soon as possible.
 */
export const LoadPageCanvas = importAfterInteractive(
  () => import("./page-canvas")
)
