export interface Experiment {
  name: string
  slug: string
}

export const experiments: Experiment[] = [
  { name: "raymarch", slug: "raymarch" },
  { name: "fluid-solidify", slug: "fluid-solidify" },
  { name: "depth", slug: "depth" },
  { name: "pyramid", slug: "pyramid" },
  { name: "liquid", slug: "liquid" },
  { name: "interaction", slug: "interaction" },
  { name: "morph", slug: "morph" },
  { name: "ferro", slug: "ferro" },
  { name: "ferro-pyramid", slug: "ferro-pyramid" },
  { name: "particles", slug: "particles" },
  { name: "water", slug: "water" },
  { name: "svg-displacement", slug: "svg-displacement" },
  { name: "water-2", slug: "water-2" },
  { name: "ferro-mesh", slug: "ferro-mesh" },
  { name: "ferro-mesh-2", slug: "ferro-mesh-2" },
  { name: "water-triangle", slug: "water-triangle" },
  { name: "water-matcap", slug: "water-matcap" },
  { name: "water-tilted-triangle", slug: "water-tilted-triangle" },
  { name: "water-soft", slug: "water-soft" }
]
