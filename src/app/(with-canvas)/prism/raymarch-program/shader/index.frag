precision highp float;

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 wPos;
varying vec3 viewDirection;

uniform vec3 cameraPosition;
uniform float time;

#pragma glslify: rayMarch = require('./raymarch.glsl', wPos = wPos, viewDirection = viewDirection, cameraPosition = cameraPosition, time=time)

void main() {
  vec4 color = rayMarch();
  gl_FragColor = vec4(color.xyz, 1.0);
  gl_FragColor.a = color.a;
}
