#version 300 es

precision highp float;

in vec3 vNormal;
in vec2 vUv;
in vec3 wPos;
in vec3 viewDirection;

uniform vec3 cameraPosition;
uniform float time;

#pragma glslify: structsModule = require('./structs.glsl', RaymarchResult=RaymarchResult)
#pragma glslify: rayMarch = require('./raymarch.glsl', wPos = wPos, viewDirection = viewDirection, cameraPosition = cameraPosition, time=time, RaymarchResult=RaymarchResult)

out vec4 fragColor;

void main() {
  RaymarchResult result = rayMarch();
  fragColor = vec4(result.color.xyz, 1.0);
  fragColor.a = result.color.a;
  gl_FragDepth = result.depth;
}
