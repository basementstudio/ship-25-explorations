"use client"

import { Portal } from "@radix-ui/react-portal"
import Link from "next/link"
import React, { FC, useState } from "react"

import type { Experiment } from "~/app/experiments"
import { usePreventScroll } from "~/hooks/use-prevent-scroll"
import { clx } from "~/lib/clx"

interface MobileMenuProps {
  links: Experiment[]
}

const MobileMenu: FC<MobileMenuProps> = ({ links }) => {
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = () => setIsOpen(false)
  const openMenu = () => setIsOpen(true)
  usePreventScroll(isOpen)

  return (
    <>
      <button
        className={clx("w-8 h-8")}
        onClick={isOpen ? closeMenu : openMenu}
      >
        <svg
          className="h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 28 28"
        >
          <path d="M1 8h15v2H1z" fill="currentColor"></path>
          <line
            x1="1"
            y1="15"
            x2="25"
            y2="15"
            stroke="currentColor"
            strokeWidth="2"
          ></line>
          <path d="M1 20h24v2H1z" fill="currentColor"></path>
        </svg>
      </button>
      {isOpen && (
        <Portal id="menu-modal">
          <div className="flex flex-col fixed inset-0 z-[100] bg-black overflow-y-auto">
            <nav className="flex-1 pt-20 pb-8 px-4">
              <ul className="flex flex-col items-center gap-6 min-h-full justify-start">
                {links.map(({ name, slug: url }) => (
                  <li key={name}>
                    <Link href={`/${url}`} onClick={closeMenu}>
                      <span className="inline-block text-lg uppercase font-extralight scale-100 hover:scale-110 transition-transform duration-150 ease-in-out">
                        {name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </Portal>
      )}
    </>
  )
}

export default MobileMenu
