#version 300 es

precision highp float;

in vec3 position;
in vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;

out vec3 vNormal;
out vec2 vUv;
out vec3 wPos;
out vec3 viewDirection;

void main() {
  vUv = uv;

  wPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  viewDirection = normalize(cameraPosition - wPos) * vec3(-1);
}
