// TODO:
// Calculate dissplacement of the vertex from the alreay displaced vertices
// That wat each peak will be able to pull out without breaking

// Also add the water simulation to it
// And the particles simulation for ferrofluids made in polar coorinates

#pragma glslify: PI = require(glsl-constants/PI)

#pragma glslify: getVogel = require(../../glsl-shared/get-vogel.glsl)
#pragma glslify: valueRemap = require(../../glsl-shared/value-remap.glsl)
#pragma glslify: snoise2 = require('glsl-noise/classic/2d')

uniform vec3 uMousePosition;

vec4 textureGood(sampler2D sam, vec2 uv) {
  vec2 texelSize = vec2(1.0) / vec2(textureSize(sam, 0));
  uv = uv / texelSize - 0.5;
  vec2 iuv = floor(uv);
  vec2 f = fract(uv);
  f = f * f * (3.0 - 2.0 * f);
  vec4 rg1 = textureLod(sam, (iuv + vec2(0.5, 0.5)) * texelSize, 0.0);
  vec4 rg2 = textureLod(sam, (iuv + vec2(1.5, 0.5)) * texelSize, 0.0);
  vec4 rg3 = textureLod(sam, (iuv + vec2(0.5, 1.5)) * texelSize, 0.0);
  vec4 rg4 = textureLod(sam, (iuv + vec2(1.5, 1.5)) * texelSize, 0.0);
  return mix(mix(rg1, rg2, f.x), mix(rg3, rg4, f.x), f.y);
}

uniform float uDiskRadius;
uniform float uHeightMax;
uniform float uHeightMin;
uniform sampler2D uNoiseTexture;
uniform float uTime;

uniform float uMainPyramidRadius;
uniform float uMainPyramidHeight;

float opSmoothUnion(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) - k * h * (1.0 - h);
}

float opSmoothSubtraction(float d1, float d2, float k) {
  float h = clamp(0.5 - 0.5 * (d2 + d1) / k, 0.0, 1.0);
  return mix(d2, -d1, h) + k * h * (1.0 - h);
}

float opSmoothIntersection(float d1, float d2, float k) {
  float h = clamp(0.5 - 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) + k * h * (1.0 - h);
}

float integralSmoothstep(float x, float T) {
  if (x > T) return x - T / 2.0;
  return x * x * x * (1.0 - x * 0.5 / T) / T / T;
}

float getPyrmidDistance(
  vec3 p,
  vec3 pyramidCenter,
  float pyramidRadius,
  float pyramidHeight
) {
  float d = length(vec3(p.x, 0.0, p.z) - pyramidCenter) / pyramidRadius;

  d = clamp(d, 0.0, 1.0);

  return d;
}

vec3 pyramid(
  vec3 p,
  vec3 pyramidCenter,
  float pyramidRadius,
  float pyramidHeight
) {
  float pyramidFactor = getPyrmidDistance(
    p,
    pyramidCenter,
    pyramidRadius,
    pyramidHeight
  );

  float d = pyramidFactor;

  vec3 directionToCenter = normalize(pyramidCenter);
  float distanceToCenter = length(pyramidCenter);

  d = 1.0 - d;
  d = d * pyramidHeight;

  p.y = max(p.y, d);

  // float distToClear

  // p.xz += directionToCenter.xz * (1.0 - pyramidFactor) * 0.2 * pyramidHeight;

  return p;
}

vec3 mainPyramid(
  vec3 p,
  vec3 pyramidCenter,
  float pyramidRadius,
  float pyramidHeight
) {
  float d = getPyrmidDistance(p, pyramidCenter, pyramidRadius, pyramidHeight);

  d = 1.0 - d;

  d = integralSmoothstep(d, 0.5);

  d = d * pyramidHeight;

  // p.y = opSmoothIntersection(p.y, d, 0.1);

  p.y = max(p.y, d);
  return p;
}

// noise functions
vec3 getNoise(vec2 uv) {
  vec3 noise = textureGood(uNoiseTexture, uv).xyz;
  return noise;
}

const int numPyramids = 60;

vec3 displacement(vec3 p) {
  // return p;
  p = mainPyramid(p, vec3(0.0), uMainPyramidRadius, uMainPyramidHeight);

  for (int i = 2; i < numPyramids; i++) {
    vec2 vogel = getVogel(1.0, float(i), float(numPyramids), 0.0);

    float d = length(vogel);

    float size = valueRemap(d, 0.0, 1.0, uHeightMax, uHeightMin);

    vec3 center = normalize(vec3(vogel.x, 0.0, vogel.y));

    center *= pow(d, 0.8) * uDiskRadius;

    float distToMouse =
      length(center - vec3(uMousePosition.x, 0.0, uMousePosition.z)) - 0.2;

    distToMouse *= 3.0;
    float distToMouseClamped = 1.0 - clamp(distToMouse, 0.0, 1.0);

    p = pyramid(p, center, size * 0.5, size * distToMouseClamped * 1.0);
  }

  float n = snoise2(p.xz * 10.0 + vec2(0.0, -uTime)) * 0.005;

  // add noise
  p.y += n * clamp(1.0 - p.y * 10.0, 0.0, 1.0);

  return p;
}

#pragma glslify: export(displacement)
