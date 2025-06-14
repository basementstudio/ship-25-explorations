"use client"

import { Mail, User } from "lucide-react"
import { PropsWithChildren, useState } from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { cn } from "~/lib/utils/utils"

interface ContentProps {
  name: string
  email: string
  setName: (name: string) => void
  setEmail: (email: string) => void
  nameFocused: boolean
  emailFocused: boolean
  setNameFocused: (nameFocused: boolean) => void
  setEmailFocused: (emailFocused: boolean) => void
  isReflection: boolean
  isLoading: boolean
  isSubmitted: boolean
  onSubmit: () => void
}

export function Content({
  name,
  email,
  setName,
  setEmail,
  nameFocused,
  emailFocused,
  setNameFocused,
  setEmailFocused,
  isReflection,
  isLoading,
  isSubmitted,
  onSubmit,
  children
}: PropsWithChildren<ContentProps>) {
  return (
    <div className="flex flex-col items-center text-center relative max-w-xl mx-auto">
      <h1 className="text-2xl font-medium mb-2">
        Vercel ship
        <span className="text-xs align-top">25</span>
      </h1>
      <div className="text-5xl font-medium mb-4">Get ready to ship.</div>
      <p className="text-lg mb-1">Join us on June 23.</p>
      <p className="text-lg mb-8">Virtually or in New York City.</p>

      <div className="w-full space-y-4">
        <div className="relative">
          <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
          <Input
            className={cn(
              "pl-10 bg-neutral-900 border-neutral-800 text-white !transition-colors !duration-200 border border-[rgba(255,255,255,0.1)]",
              "focus-visible:outline-none !ring-offset-0 !outline-none !shadow-none",
              nameFocused && "border-[rgba(255,255,255,1)]"
            )}
            placeholder="Daniel Linthwaite"
            value={name}
            onChange={(e) => setName(e.target.value)}
            readOnly={isReflection || isLoading || isSubmitted}
            disabled={isLoading || isSubmitted}
            onFocus={isReflection ? undefined : () => setNameFocused(true)}
            onBlur={isReflection ? undefined : () => setNameFocused(false)}
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
          <Input
            className={cn(
              "pl-10 bg-neutral-900 border-neutral-800 text-white !transition-colors !duration-200 border border-[rgba(255,255,255,0.1)]",
              "focus-visible:outline-none !ring-offset-0 !outline-none !shadow-none",
              emailFocused && "border-[rgba(255,255,255,1)]"
            )}
            type="email"
            placeholder="daniel.linthwaite@vercel.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={isReflection || isLoading || isSubmitted}
            disabled={isLoading || isSubmitted}
            onFocus={isReflection ? undefined : () => setEmailFocused(true)}
            onBlur={isReflection ? undefined : () => setEmailFocused(false)}
          />
        </div>
        <Button
          className="w-full"
          variant="secondary"
          onClick={onSubmit}
          disabled={isLoading || isSubmitted || isReflection}
        >
          {isLoading
            ? "Submitting..."
            : isSubmitted
              ? "Submitted!"
              : "Get Notified"}
        </Button>
      </div>
      {children}
    </div>
  )
}
