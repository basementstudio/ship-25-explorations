#version 300 es

precision highp float;

in vec3 position;
in vec2 uv;
in vec3 normal;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
uniform float uModelScale;

out vec3 vNormal;
out vec2 vUv;
out vec3 wPos;
out vec3 viewDirection;
out vec2 vScreenUV;

void main() {
  vUv = uv;
  vec3 pos = position * uModelScale;

  wPos = (modelMatrix * vec4(pos, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  viewDirection = -normalize(cameraPosition - wPos);
  vScreenUV = gl_Position.xy / gl_Position.w * 0.5 + 0.5;
}
