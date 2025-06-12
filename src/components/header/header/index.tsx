import { experiments } from "~/app/experiments"
import Link from "~/components/primitives/link"

import { GithubLink } from "./github-link"
import MobileMenu from "./mobile-menu"

export const Header = () => {
  return (
    <>
      <div className="sticky w-full top-0 p-0 bg-black/70 z-over-canvas">
        <header className="h-[3rem] px-6 flex items-center justify-between z-40 relative border-b border-[var(--color-gray-lighter)]">
          <div className="flex basis-[30%] flex-grow">
            <Link href="/" className="w-5 h-5">
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
          <div className="flex items-center gap-4">
            <GithubLink />
            <MobileMenu links={experiments} />
          </div>
        </header>
      </div>
    </>
  )
}
