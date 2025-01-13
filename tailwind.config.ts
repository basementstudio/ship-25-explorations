import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      zIndex: {
        "under-canvas": "50",
        canvas: "100",
        "over-canvas": "200",
        "debug-canvas": "9000",
        debug: "9001"
      },
      colors: {
        gray: {
          lighter: "#262626",
          DEFAULT: "#0f0f0f"
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))"
      }
    }
  },
  plugins: []
}
export default config
