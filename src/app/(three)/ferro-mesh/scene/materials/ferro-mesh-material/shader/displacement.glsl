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
uniform sampler2D uParticlesPositions;

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
  float d = length(p - pyramidCenter) / pyramidRadius;

  d = clamp(d, 0.0, 1.0);

  return d;
}

vec3 pyramid(
  vec3 p,
  vec3 pyramidCenter,
  vec3 pBase,
  float pyramidRadius,
  float pyramidHeight
) {
  float pyramidFactor = getPyrmidDistance(
    pBase,
    pyramidCenter,
    pyramidRadius,
    pyramidHeight
  );

  float d = pyramidFactor;

  vec3 directionToCenter = normalize(pyramidCenter);
  float distanceToCenter = length(pyramidCenter);

  d = 1.0 - d;
  d = d * pyramidHeight;

  p.y = max(p.y, pBase.y + d);

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

ivec2 calcCoord(int size, int id) {
  int j = int(id);
  int x = j % size;
  int y = j / size;
  return ivec2(x, y);
}

ivec2 getSampleCoord(const sampler2D mapSampler, const float batchId) {
  int size = textureSize(mapSampler, 0).x;
  return calcCoord(size, int(batchId));
}

const int numPyramids = 60;

float particlesScale = 1.2;

vec3 addParticles(vec3 pBase) {
  vec3 p = pBase;
  for (int i = 0; i < MAX_PARTICLES; i++) {
    ivec2 coord = getSampleCoord(uParticlesPositions, float(i));
    vec3 particlepos =
      texelFetch(uParticlesPositions, coord, 0).xyz *
        vec3(particlesScale, particlesScale, particlesScale) -
      vec3(vec2(particlesScale / 2.0), 0.0);

    particlepos.y *= -1.0;

    particlepos = particlepos.xzy;

    particlepos.y = pBase.y;

    float distToParticle = length(p - particlepos);

    float size = valueRemap(distToParticle, 0.0, 1.0, 0.1, 0.0);

    float distToMouse = length(particlepos - uMousePosition) - 0.06;

    distToMouse *= 5.0;

    float distToMouseClamped = 1.0 - clamp(distToMouse, 0.0, 1.0);

    distToMouseClamped = pow(distToMouseClamped, 2.0);

    p = pyramid(
      p,
      particlepos,
      pBase,
      size * distToMouseClamped * 0.5,
      size * distToMouseClamped * 0.8
    );
    // p = pyramid(p, particlepos, pBase, 0.05, 0.1);
  }

  return p;
}

vec3 displacement(vec3 p) {
  float distToCenter = length(p);

  if (distToCenter < 0.55) {
    p = mainPyramid(p, vec3(0.0), uMainPyramidRadius, uMainPyramidHeight);
    p = addParticles(p);
  }

  float n = snoise2(p.xz * 10.0 + vec2(0.0, -uTime)) * 0.005;

  // add noise
  p.y += n * clamp(1.0 - p.y * 10.0, 0.0, 1.0);

  return p;
}

#pragma glslify: export(displacement)
