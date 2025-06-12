import Link from "next/link"
import { FaGithub } from "react-icons/fa"

const baseUrl = "https://github.com/basementstudio/ship-25-explorations/"

export function GithubLink() {
  return (
    <Link target="_blank" href={baseUrl} className="flex items-center">
      <FaGithub className="w-6 h-6" />
    </Link>
  )
}
