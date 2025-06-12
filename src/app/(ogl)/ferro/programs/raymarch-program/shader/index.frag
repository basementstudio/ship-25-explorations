#version 300 es

precision highp float;

in vec2 vUv;
in vec3 wPos;
in vec2 vScreenUV;

uniform vec3 cameraPosition;
uniform float time;
uniform float uNear;
uniform float uFar;
uniform float fov;
uniform vec2 resolution;
uniform vec4 cameraQuaternion;

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

// camera utils

// https://www.geeks3d.com/20141201/how-to-rotate-a-vertex-by-a-quaternion-in-glsl/
vec4 quat_from_axis_angle(vec3 axis, float angle) {
  vec4 qr;
  float half_angle = angle * 0.5 * 3.14159 / 180.0;
  qr.x = axis.x * sin(half_angle);
  qr.y = axis.y * sin(half_angle);
  qr.z = axis.z * sin(half_angle);
  qr.w = cos(half_angle);
  return qr;
}

vec3 rotate_vertex_position(vec3 position, vec3 axis, float angle) {
  vec4 q = quat_from_axis_angle(axis, angle);
  vec3 v = position.xyz;
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

vec3 quaterion_rotate(vec3 v, vec4 q) {
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

void main() {
  // float insideZ = unpackRGB(texture(uInsideDepthTexture, vScreenUV).rgb);
  // float outsideZ = gl_FragCoord.z;

  // float thickness = getThickness(insideZ, outsideZ, uNear, uFar);

  // vec3 viewDirectionIor = getViewDirectionIor();

  // RaymarchResult result = rayMarch(wPos, viewDirectionIor, thickness);
  // fragColor[0] = result.color;

  // float depth = getDepth(result.depth);
  // depth = mix(insideZ, depth, result.color.a);

  // fragColor[1] = vec4(packRGB(depth), 1.0);

  // get camera ray
  float aspectRatio = resolution.x / resolution.y;
  vec3 cameraOrigin = cameraPosition;
  float fovMult = fov / 90.0;
  vec2 screenPos = (gl_FragCoord.xy * 2.0 - resolution) / resolution;
  screenPos.x *= aspectRatio;
  screenPos *= fovMult;
  vec3 ray = vec3(screenPos.xy, -1.0);
  ray = quaterion_rotate(ray, cameraQuaternion);
  ray = normalize(ray);

  vec3 rayOrigin = cameraPosition + ray * uNear;

  RaymarchResult result = rayMarch(rayOrigin, ray, uFar - uNear);
  fragColor[0] = result.color;

  float depth = getDepth(result.depth);
  depth = 0.5;

  fragColor[1] = vec4(packRGB(depth), 1.0);
}
