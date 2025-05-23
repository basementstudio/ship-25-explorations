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
#pragma glslify: depthModule = require('../../glsl-shared/depth.glsl', linearizeDepth = linearizeDepth, viewSpaceDepth = viewSpaceDepth)
// #pragma glslify: getSurfaceNormal = require('../../glsl-shared/get-surface-normal.glsl')
// #pragma glslify: rotateVector2 = require('../../glsl-shared/rotate-vector-2.glsl')

#pragma glslify: packRGB = require('../../glsl-shared/pack-rgb.glsl')
#pragma glslify: unpackRGB = require('../../glsl-shared/unpack-rgb.glsl')
#pragma glslify: getThickness = require('./get-thickness.glsl')

out vec4 fragColor[2];

float getDepth(float raymarchTravel) {
  // Get the current linear depth (distance from camera)
  float viewSpaceZ = linearizeDepth(gl_FragCoord.z, uNear, uFar);

  // Add our raymarch distance - both are now in view space units from camera
  float newViewSpaceZ = viewSpaceZ + raymarchTravel;

  // Convert back to [0,1] depth buffer space
  return uFar * (newViewSpaceZ - uNear) / (newViewSpaceZ * (uFar - uNear));

}

vec3 getViewDirectionIor() {
  // return viewDirection;
  // Use refract to calculate the new direction based on IOR
  // return normalize(viewDirection + vNormal * 0.1); // Very subtle deviation

  return refract(normalize(viewDirection), normalize(vNormal), 0.97);

}

void main() {
  // vec2 normal = getSurfaceNormal(vUv);
  // vec3 rotatedViewDirection = rotateVector2(viewDirection, normal * 0.005);

  float insideZ = unpackRGB(texture(uInsideDepthTexture, vScreenUV).rgb);
  float outsideZ = gl_FragCoord.z;

  float thickness = getThickness(insideZ, outsideZ, uNear, uFar);

  vec3 viewDirectionIor = getViewDirectionIor();

  RaymarchResult result = rayMarch(wPos, viewDirectionIor, thickness);
  fragColor[0] = result.color;

  float depth = getDepth(result.depth);
  depth = mix(insideZ, depth, result.color.a);

  fragColor[1] = vec4(packRGB(depth), 1.0);

}
