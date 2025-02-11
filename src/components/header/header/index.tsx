import Link from "~/components/primitives/link"

import MobileMenu from "./mobile-menu"

export interface HeaderLink {
  name: string
  url: string
}

const navLinks: HeaderLink[] = [
  { name: "raymarch", url: "/" },
  { name: "fluid-solidify", url: "/fluid-solidify" },
  { name: "depth", url: "/depth" },
  { name: "pyramid", url: "/pyramid" },
  { name: "liquid", url: "/liquid" },
  { name: "interaction", url: "/interaction" },
  { name: "morph", url: "/morph" },
  { name: "ferro", url: "/ferro" }
]

export const Header = () => {
  return (
    <>
      <div className="sticky w-full top-0 p-0 bg-black/70 z-over-canvas">
        <header className="h-[4.5rem] px-6 flex items-center justify-between z-40 relative border-b border-[var(--color-gray-lighter)]">
          <div className="flex basis-[30%] flex-grow">
            <Link href="/" className="w-6 h-6">
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
        </header>
      </div>
    </>
  )
}
