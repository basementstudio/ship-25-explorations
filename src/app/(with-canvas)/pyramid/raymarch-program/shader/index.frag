#version 300 es

precision highp float;

in vec3 vNormal;
in vec2 vUv;
in vec3 wPos;
in vec3 viewDirection;

uniform vec3 cameraPosition;
uniform float time;

#pragma glslify: structsModule = require('./structs.glsl', RaymarchResult=RaymarchResult)
#pragma glslify: rayMarch = require('./raymarch.glsl', wPos = wPos, cameraPosition = cameraPosition, time=time, RaymarchResult=RaymarchResult)
#pragma glslify: getSurfaceNormal = require('../../glsl-shared/get-surface-normal.glsl')
#pragma glslify: rotateVector2 = require('../../glsl-shared/rotate-vector-2.glsl')

out vec4 fragColor;

#pragma glslify: PI = require('glsl-constants/pi')

void main() {
  vec2 normal = getSurfaceNormal(vUv);
  vec3 rotatedViewDirection = rotateVector2(viewDirection, normal * 0.05);

  RaymarchResult result = rayMarch(rotatedViewDirection);
  fragColor = vec4(result.color.xyz, 1.0);
  fragColor.a = result.color.a;
  gl_FragDepth = result.depth;
}
