import { Program } from "ogl"

import { GLOBAL_GL } from ".."

export const COLOR_VERTEX = /* glsl */ `
  attribute vec3 position;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const COLOR_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;

  void main() {
    gl_FragColor = vec4(uColor, 1.0);
  }
`

/* Default color program */
export const COLOR_PROGRAM = new Program(GLOBAL_GL, {
  vertex: COLOR_VERTEX,
  fragment: COLOR_FRAGMENT,
  uniforms: {
    uColor: { value: null }
  }
})
