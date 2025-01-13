export type EasingFunction = (t: number) => number

export const inOutQuad: EasingFunction = (x) =>
  x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2

export const outQuad: EasingFunction = (x) => 1 - (1 - x) * (1 - x)

export const inQuad: EasingFunction = (x) => x * x

export const inQuart: EasingFunction = (x) => x * x * x * x

export const inOutCubic: EasingFunction = (x) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2

export const inOurExpo: EasingFunction = (x) =>
  x === 0 ? 0 : Math.pow(2, 10 * x - 10)

export const linear: EasingFunction = (x) => x
