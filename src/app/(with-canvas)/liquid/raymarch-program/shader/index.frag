#version 300 es

precision highp float;

in vec3 vNormal;
in vec2 vUv;
in vec3 wPos;
in vec3 viewDirection;
in vec2 vScreenUV;

uniform vec3 cameraPosition;
uniform float time;
uniform sampler2D uInsideDepthTexture;
uniform sampler2D uInsideNormalTexture;
uniform float uNear;
uniform float uFar;

#pragma glslify: structsModule = require('./structs.glsl', RaymarchResult=RaymarchResult)
#pragma glslify: rayMarch = require('./raymarch.glsl', wPos = wPos, time=time, RaymarchResult=RaymarchResult, texture = texture)
// #pragma glslify: getSurfaceNormal = require('../../glsl-shared/get-surface-normal.glsl')
// #pragma glslify: rotateVector2 = require('../../glsl-shared/rotate-vector-2.glsl')

#pragma glslify: unpackRGB = require('../../glsl-shared/unpack-rgb.glsl')
#pragma glslify: getThickness = require('./get-thickness.glsl')

out vec4 fragColor;

void main() {
  // vec2 normal = getSurfaceNormal(vUv);
  // vec3 rotatedViewDirection = rotateVector2(viewDirection, normal * 0.005);

  float insideZ = unpackRGB(texture(uInsideDepthTexture, vScreenUV).rgb);
  float outsideZ = gl_FragCoord.z;

  float thickness = getThickness(insideZ, outsideZ, uNear, uFar);

  RaymarchResult result = rayMarch(wPos, normalize(viewDirection), thickness);
  fragColor = result.color;

  // TODO: fix, the depth should be remaped from world space to 0-1
  gl_FragDepth = result.depth;

}
