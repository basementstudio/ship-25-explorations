import Link from "next/link"

import { Experiment } from "~/app/experiments"

export function ExperimentBlock({ experiment }: { experiment: Experiment }) {
  return (
    <Link href={`/${experiment.slug}`}>
      <div className="aspect-video relative  border-neutral-600 overflow-hidden">
        <video
          className="w-full h-full object-cover"
          src={`/previews/${experiment.slug}.mp4`}
          autoPlay
          muted
          loop
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <h2 className="absolute bottom-0 left-0 right-0 p-4 text-white text-md font-mono tracking-tight">
          {experiment.name}
        </h2>
      </div>
    </Link>
  )
}
