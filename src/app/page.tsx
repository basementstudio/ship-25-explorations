import { ExperimentBlock } from "~/components/preview/block"

import { experiments } from "./experiments"

export default function Home() {
  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {experiments.map((experiment) => (
          <ExperimentBlock key={experiment.slug} experiment={experiment} />
        ))}
      </div>
    </div>
  )
}
