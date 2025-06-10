import Link from "next/link"

import { Experiment } from "~/app/experiments"

export function ExperimentBlock({ experiment }: { experiment: Experiment }) {
  return (
    <Link href={`/${experiment.slug}`}>
      <div className="relative flex flex-col gap-4 border-neutral-800 overflow-hidden rounded-md p-4 border hover:border-neutral-500 transition-all duration-200">
        <video
          className="aspect-video relative w-full h-full object-cover rounded-md"
          src={`/previews/${experiment.slug}.mp4`}
          autoPlay
          muted
          loop
          playsInline
        />
        <h2 className="text-white text-md font-mono tracking-tight leading-none">
          {experiment.name}
        </h2>
      </div>
    </Link>
  )
}
