// fucntion to draw the main pyramid

import { mix, smoothstep, clamp } from "~/lib/utils/math"

const f1 = (x: number) => 1. - Math.sqrt(x * x + 0.001)

const f2 = (x: number, t: number) => (Math.sqrt(x * x + t) - Math.sqrt(t))

const f3 = (x: number) => (f2(x - 1, 0.1) * 1.1)

const f4 = (x: number) => mix(f1(x), f3(x), smoothstep(0, 1, x))

const PYRAMID_RADIUS = 0.3
const PYRAMID_HEIGHT = 0.48
const NORMAL_EPSILON = 0.01

export function calculatePyramid(x: number, y: number) {
  let distance = Math.sqrt(x * x + y * y) / PYRAMID_RADIUS
  distance = clamp(0, 1, distance)
  return f4(distance) * PYRAMID_HEIGHT
}

/**
 * Get the normal of the pyramid
 * @param x - x coordinate
 * @param y - y coordinate
 * @param h - pre-calculated height at x,y
 */
export function getNormal(x: number, y: number, h: number): [number, number, number] {
  const h1 = h
  const h2 = calculatePyramid(x + NORMAL_EPSILON, y)
  const h3 = calculatePyramid(x, y + NORMAL_EPSILON)

  // Correctly calculate the gradient components (derivatives)
  const nx = (h2 - h1) / NORMAL_EPSILON
  const ny = (h3 - h1) / NORMAL_EPSILON
  const nz = 1.0

  // Normalize the vector
  const length = Math.sqrt(nx * nx + ny * ny + nz * nz)
  return [nx / length, ny / length, nz / length]
}