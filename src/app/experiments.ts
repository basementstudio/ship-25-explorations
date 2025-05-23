export interface Experiment {
  name: string
  slug: string
}

export const experiments: Experiment[] = [
  { name: "Basic raymarcher", slug: "raymarch" },
  { name: "Fluid wall", slug: "fluid-solidify" },
  { name: "Interactive floor", slug: "depth" },
  { name: "Opaque pyramid", slug: "pyramid" },
  { name: "Liquid pyramid", slug: "liquid" },
  { name: "Hover interaction", slug: "interaction" },
  { name: "Morph shapes", slug: "morph" },
  { name: "Ferrofluid 1", slug: "ferro" },
  { name: "Ferrofluid pyramid", slug: "ferro-pyramid" },
  { name: "Particles", slug: "particles" },
  { name: "Water", slug: "water" },
  { name: "SVG displacement", slug: "svg-displacement" },
  { name: "Water 2", slug: "water-2" },
  { name: "Ferro mesh", slug: "ferro-mesh" },
  { name: "Ferro mesh 2", slug: "ferro-mesh-2" },
  { name: "Water triangle", slug: "water-triangle" },
  { name: "Water matcap", slug: "water-matcap" },
  { name: "Water tilted triangle", slug: "water-tilted-triangle" },
  { name: "Water soft", slug: "water-soft" }
]
