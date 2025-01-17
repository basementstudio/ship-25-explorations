precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 wPos;
varying vec3 viewDirection;
varying vec2 vScreenUV;

void main() {
  vUv = uv;

  wPos = (modelMatrix * vec4(position, 1.0)).xyz;

  vec4 projectedPosition =
    projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectedPosition;
  vScreenUV = projectedPosition.xy / projectedPosition.w * 0.5 + 0.5;
  viewDirection = normalize(cameraPosition - wPos) * vec3(-1);
}
