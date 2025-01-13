import { LoadPageCanvas } from "~/gl/components/load-page-canvas"
import { HtmlOut } from "~/gl/tunnel"

export default function WithCanvasLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <HtmlOut />
      <LoadPageCanvas />
      {children}
    </>
  )
}
