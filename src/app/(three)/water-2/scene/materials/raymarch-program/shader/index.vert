#version 300 es

precision highp float;

in vec3 position;
in vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

out vec3 vNormal;
out vec2 vUv;
out vec3 wPos;
out vec2 vScreenUV;

void main() {
  vUv = uv;
  vec3 pos = position;

  wPos = (modelMatrix * vec4(pos, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  vScreenUV = gl_Position.xy / gl_Position.w * 0.5 + 0.5;
}
