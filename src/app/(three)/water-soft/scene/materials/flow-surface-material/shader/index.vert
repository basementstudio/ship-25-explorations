precision highp float;

in vec3 position;
in vec2 uv;

out vec2 vUv;
out vec3 vWorldPosition;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;

void main() {
  vUv = uv;
  vWorldPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position =
    projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
