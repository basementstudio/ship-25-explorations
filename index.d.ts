import "react"

import { extend, OGLElement } from "react-ogl"

declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined
  }
}

class CustomElement {}

declare module "react-ogl" {
  interface OGLElements {
    customElement: OGLElement<typeof CustomElement>
  }
}

extend({ CustomElement })
