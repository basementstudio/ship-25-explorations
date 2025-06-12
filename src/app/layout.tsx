import "./globals.css"

import type { Metadata } from "next"
import { Inter } from "next/font/google"

import { Header } from "~/components/header/header"

import { AppHooks } from "./app-hooks"
import { HtmlOut } from "./gl/tunnel"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Ship explorations | basement.studio",
  description: "Vercel Ship 25 explorations."
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-svh flex flex-col`}>
        <AppHooks />
        <Header />
        <HtmlOut />
        {children}
      </body>
    </html>
  )
}
