// fucntion to draw the main pyramid
const PYRAMID_RADIUS = 0.35
const PYRAMID_HEIGHT = 0.48
const NORMAL_EPSILON = 0.01

import { mix, smoothstep, clamp } from "~/lib/utils/math"

const f1 = (x: number) => 1. - Math.sqrt(x * x + 0.001)

const f2 = (x: number, t: number) => (Math.sqrt(x * x + t) - Math.sqrt(t))

const f3 = (x: number) => (f2(x - 1, 0.1) * 1.1)

const f4 = (x: number) => mix(f1(x), f3(x), smoothstep(0, 1, x))

export function calculatePyramid(x: number, y: number) {
  let distance = Math.hypot(x, + y) / PYRAMID_RADIUS
  distance = clamp(0, 1, distance)
  return f4(distance) * PYRAMID_HEIGHT
}

/**
 * Get the normal of the pyramid
 * @param x - x coordinate
 * @param z - z coordinate
 * @param h - pre-calculated height at x,y
 */
export function getPyramidNormal(x: number, z: number, h: number): [number, number, number] {
  const hCenter = h
  const hx = calculatePyramid(x + NORMAL_EPSILON, z)
  const hz = calculatePyramid(x, z + NORMAL_EPSILON)

  // For a height field y = h(x,z), the normal is (-dh/dx, 1, -dh/dz)
  const n = [
    -(hx - hCenter) / NORMAL_EPSILON,
    1.0,
    -(hz - hCenter) / NORMAL_EPSILON,
  ] as [number, number, number]

  return normalize(n)
}

const normalize = (n: [number, number, number]): [number, number, number] => {
  const length = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2])
  return [n[0] / length, n[1] / length, n[2] / length]
}


