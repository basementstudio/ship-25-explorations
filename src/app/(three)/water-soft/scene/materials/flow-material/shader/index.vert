precision highp float;

attribute vec3 position;
attribute vec2 uv;

varying vec2 vUv;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
