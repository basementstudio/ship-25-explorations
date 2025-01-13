import React from "react"

import Link from "~/components/primitives/link"
import { clx } from "~/lib/clx"

import MobileMenu from "./mobile-menu"

export interface HeaderLink {
  name: string
  url: string
}

const navLinks: HeaderLink[] = [
  { name: "Home", url: "/" },
  { name: "About", url: "/about" },
  { name: "Contact", url: "/contact" }
]

export const Header = () => {
  return (
    <>
      <Link
        target="_blank"
        href="https://foundry.basement.studio/"
        className="flex relative items-center justify-center gap-2 border-b border-[var(--color-gray-lighter)] h-10 w-full z-over-canvas"
      >
        <p className="leading-[1.19rem] tracking-[-0.02em] uppercase text-[max(12px,0.625vw)]">
          Introducing BASEMENT FOUNDRY. Check it out
        </p>
        <svg
          className="h-3"
          viewBox="0 0 20 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.9497 1.56716L15.7542 6.3806L-3.76766e-07 6.3806L-2.78905e-07 8.6194L15.7542 8.6194L10.9497 13.4328L12.514 15L20 7.5L12.514 4.06671e-07L10.9497 1.56716Z"
            fill="white"
          />
        </svg>
      </Link>
      <div className="sticky w-full top-0 p-0 bg-black/70 z-over-canvas">
        <header className="h-[4.5rem] px-6 flex items-center justify-between z-40 relative border-b border-[var(--color-gray-lighter)]">
          <div className="flex basis-[30%] flex-grow">
            <Link href="/" className="w-11 h-9">
              <svg
                className="h-full"
                viewBox="0 0 250 250"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M59.4125 135.371C59.4125 125.265 67.6033 117.074 77.7092 117.074H106.703C116.809 117.074 125 125.265 125 135.371V179.308C125 189.414 116.809 197.604 106.703 197.604H77.7092C67.6033 197.604 59.4125 189.414 59.4125 179.308V135.371ZM57.5645 202.569C57.5645 229.105 79.0754 250 105.612 250H134.758C161.703 250 183.549 228.154 183.549 201.209V112.83C183.549 85.8847 161.703 64.0385 134.758 64.0385H98.1649C76.7151 64.0385 59.2844 81.957 59.132 103.401V0H0.58252V248.78H57.5645V202.569Z"
                  fill="white"
                />
                <path
                  d="M249.418 197.604H198.187V248.835H249.418V197.604Z"
                  fill="white"
                />
              </svg>
            </Link>
          </div>
          <ul className="hidden md:flex items-center gap-[0.925rem]">
            {navLinks.map(({ name, url }) => (
              <li
                key={name}
                className="text-[max(16px,0.925vw)] font-light relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1px] after:bottom-[-1px] after:left-0 after:bg-white after:origin-bottom-right after:transition-transform after:duration-150 after:ease-in-out hover:after:scale-x-100 hover:after:origin-bottom-left"
              >
                <Link href={url}>{name}</Link>
              </li>
            ))}
          </ul>
          <MobileMenu links={navLinks} />
          <div className="hidden md:flex items-center justify-end flex-grow basis-[30%] gap-[0.925rem]">
            <button
              className={clx(
                "text-[max(16px,0.925vw)] py-[0.325rem] px-[1.35rem] rounded-[999px] transition-all duration-150 ease-in-out font-semibold hover:text-white",
                "border border-[var(--color-gray)] bg-[var(--color-gray-lighter)] text-white hover:border-[var(--color-gray-lighter)] hover:bg-black"
              )}
            >
              Primary
            </button>
            <button
              className={clx(
                "text-[max(16px,0.925vw)] py-[0.325rem] px-[1.35rem] rounded-[999px] transition-all duration-150 ease-in-out font-semibold hover:text-white",
                "border border-[var(--color-gray-lighter)] bg-black text-white italic hover:bg-[var(--color-gray-lighter)]"
              )}
            >
              Secondary
            </button>
          </div>
        </header>
      </div>
    </>
  )
}
