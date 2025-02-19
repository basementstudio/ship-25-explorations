import { LoadPageCanvas } from "~/gl/components/load-page-canvas"

export default function WithCanvasLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <LoadPageCanvas />
      {children}
    </>
  )
}
