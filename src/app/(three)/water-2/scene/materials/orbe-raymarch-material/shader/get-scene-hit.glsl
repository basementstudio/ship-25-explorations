const float PI = 3.14159265359;

#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)

#pragma glslify: valueRemap = require('../../glsl-shared/value-remap')

uniform vec3 uHitPosition;
uniform float noiseScale;
uniform float noiseLength;
uniform sampler2D uFlowTexture;
uniform float pyramidReveal;
uniform sampler2D uNoiseTexture;
uniform float mouseSpeed;
uniform mat4 uPyramidMatrix;
uniform float uFlowSize;
// AVAILABLE: uniform float time;

float sdSphere(vec3 position, float radius) {
  return length(position) - radius;
}

float sdPlane(vec3 position) {
  return position.y;
}

float tetrahedron(vec3 p, float size) {
  p = (uPyramidMatrix * vec4(p, 1.0)).xyz;
  p /= size;
  float d = (max(abs(p.x + p.y) - p.z, abs(p.x - p.y) + p.z) - 1.0) / sqrt(3.0);
  return d * size;
}

float plane(vec3 p, vec3 c, vec3 n) {
  return dot(p - c, n);
}

// sdf functions

float opUnion(float d1, float d2) {
  return min(d1, d2);
}

float opIntersection(float d1, float d2) {
  return max(d1, d2);
}

float opSmoothUnion(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) - k * h * (1.0 - h);
}

// remap functions

float gain(float x, float k) {
  float a = 0.5 * pow(2.0 * (x < 0.5 ? x : 1.0 - x), k);
  return x < 0.5
    ? a
    : 1.0 - a;
}

float expStep(float x, float n) {
  return exp2(-exp2(n) * pow(x, n));
}

// a when t = 0
// b when t = 0.5
// c when t = 1
float mix3(float a, float b, float c, float t) {
  if (t < 0.5) {
    return mix(a, b, t * 2.0);
  } else {
    return mix(b, c, (t - 0.5) * 2.0);
  }
}

float almostUnitIdentity(float x) {
  return x * x * (2.0 - x);
}

// blur

vec4 blurTexture(sampler2D sam, vec2 uv) {
  vec2 e = vec2(1.0) / vec2(textureSize(sam, 0));
  vec4 sum = vec4(0.0);
  float weight = 0.0;

  // Gaussian kernel weights
  float kernel[9] = float[](
    0.077847,
    0.123317,
    0.077847,
    0.123317,
    0.195346,
    0.123317,
    0.077847,
    0.123317,
    0.077847
  );

  // 3x3 kernel
  for (int i = -1; i <= 1; i++) {
    for (int j = -1; j <= 1; j++) {
      vec2 offset = vec2(float(i), float(j)) * e;
      float w = kernel[(i + 1) * 3 + (j + 1)];
      sum += texture(sam, uv + offset) * w;
      weight += w;
    }
  }

  return sum / weight;
}

// noise functions
vec3 getNoise(vec2 uv) {
  vec3 noise = texture(uNoiseTexture, uv).xyz;
  return noise;
}

float getCircleSin(vec3 p) {
  float d = distance(p, uHitPosition * 0.5);
  float s = sin(d * 30.0);
  return s * 0.5 + 0.5;
}

// objects
float getOrbeHit(vec3 p) {
  vec3 orbeP = p;
  float pyramidMinP = -0.8;
  float pyramidMaxP = 0.5;
  float orbeYPos = mix(pyramidMinP, pyramidMaxP, pyramidReveal);

  float noiseAmmount = 1.0 - pyramidReveal;

  if (noiseAmmount > 0.0) {
    float noise = snoise3(
      (orbeP.xyz + vec3(0.0, time * 0.1 - orbeYPos * 0.9, time * 0.2)) * 5.0
    );

    float noiseMult = 1.0 - expStep(noiseAmmount, 2.0);

    // hard noise
    float noise1 = noise;
    // noise1 = pow(noise1, 0.5);
    noise1 *= noiseMult;

    // orbeP.x += noise1 * 0.01;
    orbeP.z += noise1 * 0.06;
    orbeP.y += noise * 0.1 * noiseMult;
  }

  orbeP -= vec3(0.0, orbeYPos, 0.0);
  float scale = 0.2;
  return tetrahedron(orbeP, 0.2);
}

float getSpikesHit(vec3 pos, float flow) {
  vec3 p = pos;

  float shiftInlfuence = p.y * 10.0;

  p -= uHitPosition;
  float dist = length(p) * 2.0;
  vec3 direction = normalize(p);

  float dist2 = dist - 0.01;
  dist2 = max(dist2, 0.0);
  p.xz -= direction.xz * shiftInlfuence * dist2 * 0.1;

  p += uHitPosition;

  p += uHitPosition * 0.2;
  float sinCos = sin(p.x * 60.0) * cos(p.z * 60.0);
  return sinCos;
}

float flowEdge = 0.4;

float getFlowHit(vec3 p) {
  vec2 uv = p.xz;
  uv = vec2(
    valueRemap(uv.x, -uFlowSize, uFlowSize, 0.0, 1.0),
    valueRemap(uv.y, -uFlowSize, uFlowSize, 0.0, 1.0)
  );
  uv = clamp(uv, 0.0, 1.0);
  uv.y = 1.0 - uv.y;
  float flow = texture(uFlowTexture, uv).x;
  // flow = smoothstep(0.0, 1.0, flow);
  // remap from 0-1 to -1-1
  flow *= 2.0;
  flow -= 1.0;

  // flow = almostUnitIdentity(flow);
  // flow = -0.2;

  flow *= 0.2;

  // smoot out to edges
  float edge = smoothstep(0.0, flowEdge, uv.x);
  edge *= smoothstep(0.0, flowEdge, uv.y);
  edge *= smoothstep(1.0, 1.0 - flowEdge, uv.x);
  edge *= smoothstep(1.0, 1.0 - flowEdge, uv.y);
  // edge = 1.0 - edge;

  flow *= edge;

  return flow;
}

float getFloorHit(vec3 p) {
  // plane with flow
  float flow = getFlowHit(p);
  float planeY = 0.0;
  planeY += flow;
  vec3 pPlane = p - vec3(0.0, planeY, 0.0);
  float plane = sdPlane(pPlane);
  return plane;
}

float sdPyramid(vec3 p, float h) {
  float m2 = h * h + 0.25;

  p.xz = abs(p.xz);
  p.xz = p.z > p.x ? p.zx : p.xz;
  p.xz -= 0.5;

  vec3 q = vec3(p.z, h * p.y - 0.5 * p.x, h * p.x + 0.5 * p.y);

  float s = max(-q.x, 0.0);
  float t = clamp((q.y - 0.5 * p.z) / (m2 + 0.25), 0.0, 1.0);

  float a = m2 * (q.x + s) * (q.x + s) + q.y * q.y;
  float b =
    m2 * (q.x + 0.5 * t) * (q.x + 0.5 * t) + (q.y - m2 * t) * (q.y - m2 * t);

  float d2 = min(q.y, -q.x * m2 - q.y * 0.5) > 0.0 ? 0.0 : min(a, b);

  return sqrt((d2 + q.z * q.z) / m2) * sign(max(q.z, -p.y));
}

float getSceneHit(vec3 p) {
  vec3 orbeP = (uPyramidMatrix * vec4(p, 1.0)).xyz;

  float hit = sdPyramid(orbeP, 1.0);

  return hit * 0.3;
}

// float getSceneHitOld(vec3 p) {
//   float planeY = 0.0;
//   float flow = getFlowHit(p);
//   float clampFlow = clamp(flow, 0.0, 1.0);

//   float ferroFlow = smoothstep(0.7, 1.0, flow);

//   float spikes = getSpikesHit(p, flow);
//   spikes = ferroFlow * spikes * 0.5;
//   spikes *= 0.1;

//   float bubble = smoothstep(0.7, 1.0, flow) * 0.05;
//   planeY += spikes + bubble;

//   float circleSin = getCircleSin(p);

//   float noise = 0.0;
//   noise += getNoise2(p);
//   // remap flow from 0 to 1 to 0-1-0
//   noise *= cos(clampFlow * PI * 2.0 + PI) * 0.5 + 0.5;
//   noise *= circleSin;
//   noise *= mouseSpeed;
//   planeY += noise * 0.1;

//   vec3 pPlane = p - vec3(0.0, planeY, 0.0);
//   float plane = sdPlane(pPlane);

//   // return plane;

//   float normalMixer = cos(time * 5.0) * 0.5 + 0.5;
//   normalMixer = gain(normalMixer, 3.0);

//   float orbeHit = getOrbeHit(p);

//   float hit;

//   // hit = orbeHit;

//   hit = mix3(
//     plane,
//     opSmoothUnion(plane, orbeHit, 0.5) + getNoise2(p) * 0.05,
//     orbeHit,
//     pyramidReveal
//   );

//   return hit;

// }

#pragma glslify: export(getSceneHit)
