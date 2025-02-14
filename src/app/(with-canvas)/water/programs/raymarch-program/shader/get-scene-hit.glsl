#pragma glslify: cnoise4d = require('glsl-noise/classic/4d')

const float PI = 3.14159265359;

uniform vec3 uHitPosition;
uniform float noiseScale;
uniform float noiseLength;
uniform sampler2D uFlowTexture;
uniform float pyramidReveal;
uniform sampler2D uNoiseTexture;
uniform float mouseSpeed;

uniform mat4 uPyramidMatrix;

float sdSphere(vec3 position, float radius) {
  return length(position) - radius;
}

float sdPlane(vec3 position) {
  return position.y;
}

float plane(vec3 p, vec3 c, vec3 n) {
  return dot(p - c, n);
}

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

float getNoise(vec3 p) {
  float n = sin(p.x * 20.0) * 0.5 + 0.5 + (sin(p.z * 20.0) * 0.5 + 0.5);
  n *= 0.5;
  return n;
}

// https://www.shadertoy.com/view/Ntd3DX
float pyramid(
  vec3 position,
  float halfWidth,
  float halfDepth,
  float halfHeight
) {
  position.y += halfHeight;
  position.xz = abs(position.xz);
  vec3 d1 = vec3(
    max(position.x - halfWidth, 0.0),
    position.y,
    max(position.z - halfDepth, 0.0)
  );
  vec3 n1 = vec3(0.0, halfDepth, 2.0 * halfHeight);
  float k1 = dot(n1, n1);
  float h1 = dot(position - vec3(halfWidth, 0.0, halfDepth), n1) / k1;
  vec3 n2 = vec3(k1, 2.0 * halfHeight * halfWidth, -halfDepth * halfWidth);
  float m1 = dot(position - vec3(halfWidth, 0.0, halfDepth), n2) / dot(n2, n2);
  vec3 d2 =
    position -
    clamp(
      position - n1 * h1 - n2 * max(m1, 0.0),
      vec3(0.0),
      vec3(halfWidth, 2.0 * halfHeight, halfDepth)
    );
  vec3 n3 = vec3(2.0 * halfHeight, halfWidth, 0.0);
  float k2 = dot(n3, n3);
  float h2 = dot(position - vec3(halfWidth, 0.0, halfDepth), n3) / k2;
  vec3 n4 = vec3(-halfWidth * halfDepth, 2.0 * halfHeight * halfDepth, k2);
  float m2 = dot(position - vec3(halfWidth, 0.0, halfDepth), n4) / dot(n4, n4);
  vec3 d3 =
    position -
    clamp(
      position - n3 * h2 - n4 * max(m2, 0.0),
      vec3(0.0),
      vec3(halfWidth, 2.0 * halfHeight, halfDepth)
    );
  float d = sqrt(min(min(dot(d1, d1), dot(d2, d2)), dot(d3, d3)));
  return max(max(h1, h2), -position.y) < 0.0
    ? -d
    : d;
}

// square base
float pyramid(vec3 position, float halfWidth, float halfHeight) {
  position.y += halfHeight;
  position.xz = abs(position.xz);
  if (position.x > position.z) {
    position.xz = position.zx;
  }
  vec3 d1 = vec3(
    max(position.x - halfWidth, 0.0),
    position.y,
    max(position.z - halfWidth, 0.0)
  );
  vec3 q = position;
  float k = halfWidth * halfWidth + 4.0 * halfHeight * halfHeight;
  float h =
    dot(q.yz - vec2(0.0, halfWidth), vec2(halfWidth, 2.0 * halfHeight)) / k;
  q.yz -= vec2(halfWidth, 2.0 * halfHeight) * h;
  q -=
    vec3(k, 2.0 * halfHeight * halfWidth, -halfWidth * halfWidth) *
    max(q.x - q.z, 0.0) /
    (k + halfWidth * halfWidth);
  vec3 d2 =
    position -
    clamp(q, vec3(0.0), vec3(halfWidth, 2.0 * halfHeight, halfWidth));
  float d = sqrt(min(dot(d1, d1), dot(d2, d2)));
  return max(h, -position.y) < 0.0
    ? -d
    : d;
}

float sdTriPrism(vec3 p, vec2 h) {
  vec3 q = abs(p);
  return max(q.z - h.y, max(q.x * 0.866025 + p.y * 0.5, -p.y) - h.x * 0.5);
}

float gain(float x, float k) {
  float a = 0.5 * pow(2.0 * (x < 0.5 ? x : 1.0 - x), k);
  return x < 0.5
    ? a
    : 1.0 - a;
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

vec4 qmul(vec4 q1, vec4 q2) {
  return vec4(
    q1.w * q2.xyz + q2.w * q1.xyz + cross(q1.xyz, q2.xyz),
    q1.w * q2.w - dot(q1.xyz, q2.xyz)
  );
}

vec4 quat_from_axis_angle(vec3 axis, float angle) {
  vec4 qr;
  float half_angle = angle * 0.5 * 3.14159 / 180.0;
  qr.x = axis.x * sin(half_angle);
  qr.y = axis.y * sin(half_angle);
  qr.z = axis.z * sin(half_angle);
  qr.w = cos(half_angle);
  return qr;
}

vec3 rotateVector(vec3 v, vec4 q) {
  vec4 qv = qmul(q, vec4(v, 0.0));
  vec4 qinv = vec4(-q.xyz, q.w);
  return qmul(qv, qinv).xyz;
}

#pragma glslify: unpackRGB = require('../../glsl-shared/unpack-rgb')

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

vec4 getFlowHit(vec3 p) {
  vec2 uv = p.xz;
  uv += 2.0;
  uv /= 4.0;
  uv = clamp(uv, 0.0, 1.0);
  uv.y = 1.0 - uv.y;
  vec4 flow = blurTexture(uFlowTexture, uv);

  // smoot out to edges
  float edge = smoothstep(0.0, 0.1, uv.x);
  edge *= smoothstep(0.0, 0.1, uv.y);
  edge *= smoothstep(1.0, 0.9, uv.x);
  edge *= smoothstep(1.0, 0.9, uv.y);
  return flow * edge;
}

float tetrahedron(vec3 p, float size) {
  p = (uPyramidMatrix * vec4(p, 1.0)).xyz;
  p /= size;
  float d = (max(abs(p.x + p.y) - p.z, abs(p.x - p.y) + p.z) - 1.0) / sqrt(3.0);
  return d * size;
}

float getOrbeHit(vec3 p) {
  vec3 orbeP = p;
  float pyramidMinP = -0.8;
  float pyramidMaxP = 0.0;
  float reveal = mix(pyramidMinP, pyramidMaxP, pyramidReveal);
  orbeP -= vec3(0.0, reveal, 0.0);
  float scale = 0.2;

  return tetrahedron(orbeP, 0.2);
}

float getSpikes(vec3 pos, float flow) {
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

float getNoise2(vec3 p) {
  float n = cnoise4d(vec4(p * 5.0, time * 2.0));
  return n;
}

float getCircleSin(vec3 p) {
  float d = distance(p, uHitPosition * 0.5);
  float s = sin(d * 30.0);
  return s * 0.5 + 0.5;
}

float getSceneHit(vec3 p) {
  vec4 flow = getFlowHit(p);

  float planeY = 0.0;

  planeY += flow.x * 0.1;

  vec3 pPlane = p - vec3(0.0, planeY, 0.0);
  float plane = sdPlane(pPlane);

  return plane * 0.3;
}

// float getSceneHitOld(vec3 p) {
//   float planeY = 0.0;
//   float flow = getFlowHit(p);
//   float clampFlow = clamp(flow, 0.0, 1.0);

//   float ferroFlow = smoothstep(0.7, 1.0, flow);

//   float spikes = getSpikes(p, flow);
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
