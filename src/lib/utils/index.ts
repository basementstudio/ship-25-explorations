import { isClient } from "~/lib/constants"

export const formatError = (
  error: unknown
): { message: string; name?: string } => {
  try {
    if (error instanceof Error) {
      return { message: error.message, name: error.name }
    }
    return { message: String(error) }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return { message: "Un error desconocido ocurrió." }
  }
}

export const isApiSupported = (api: string) => isClient && api in window

/* Builds responsive sizes string for images */
export const getSizes = (
  entries: ({ breakpoint: string; width: string } | string | number)[]
) => {
  const sizes = entries.map((entry) => {
    if (!entry) {
      return ""
    }

    if (typeof entry === "string") {
      return entry
    }

    if (typeof entry === "number") {
      return `${entry}px`
    }

    if (entry.breakpoint.includes("px") || entry.breakpoint.includes("rem")) {
      return `(min-width: ${entry.breakpoint}) ${entry.width}`
    }

    throw new Error(`Invalid breakpoint: ${entry.breakpoint}`)
  })

  return sizes.join(", ")
}

export interface SplittedText {
  chars: string[]
  words: [string, string[]][]
}

export const splitText = (text: string): SplittedText => {
  const chars: string[] = []
  const words: [string, string[]][] = []

  text.split(" ").forEach((word, i, wordArr) => {
    /* If not last add space to last letters */
    const wordChars = word.split("").map((char, j, charArr) => {
      const isLastWord = i === wordArr.length - 1
      const isLastChar = j === charArr.length - 1

      return !isLastWord && isLastChar ? `${char} ` : char
    })

    chars.push(...wordChars)

    words.push([word, wordChars])
  })

  return {
    chars,
    words
  }
}
