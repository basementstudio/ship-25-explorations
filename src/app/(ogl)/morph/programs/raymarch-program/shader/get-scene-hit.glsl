#pragma glslify: cnoise4d = require('glsl-noise/classic/4d')

uniform vec3 uHitPosition;
uniform float noiseScale;
uniform float noiseLength;
uniform sampler2D uFlowTexture;

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
  float t1 = smoothstep(0.0, 1.0, t);
  float t2 = t1 * 2.0;

  float mixA = mix(a, b, clamp(t2, 0.0, 1.0));
  float mixB = mix(b, c, clamp(t2 - 1.0, 0.0, 1.0));
  return mix(mixA, mixB, t1);
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

float getFlowHit(vec3 p) {
  vec2 uv = p.xz;
  uv += 1.0;
  uv /= 2.0;
  uv = clamp(uv, 0.0, 1.0);
  uv.y = 1.0 - uv.y;
  vec4 flow = texture(uFlowTexture, uv);
  return flow.r;
}

float getOrbeHit(vec3 p) {
  vec3 orbeP = p;
  vec4 q = quat_from_axis_angle(vec3(0, 1.0, 0.0), time * 200.0);
  orbeP = rotateVector(orbeP, q);
  orbeP -= vec3(0.0, 0.2, 0.0);

  return pyramid(orbeP, 0.3, 0.3);
}

float getSceneHit(vec3 p) {
  float planeY = 0.0;

  float noiseSampleBig = cnoise4d(
    vec4((p * 4.0 + vec3(time * 1.0, sin(time), 0.0)) * 1.0, time * 0.5)
  );

  float noiseSampleSmall = cnoise4d(
    vec4(p * noiseScale * vec3(1.0, 0.0, 1.0), 0.0)
  );
  noiseSampleSmall *= noiseSampleSmall;

  float noiseSin = getNoise(p) * 0.3;

  float flowHit = getFlowHit(p);

  float planeNoise = flowHit;
  planeNoise *= noiseSampleSmall * noiseLength;
  planeNoise *= noiseSin;

  float mouseCenter = length(p - uHitPosition) * 2.0;
  mouseCenter = clamp(mouseCenter, 0.0, 2.0);

  float ballHit = length(p - uHitPosition) * 2.0 - noiseSampleBig * 0.5;
  ballHit = clamp(ballHit, 0.0, 1.0);
  ballHit = smoothstep(0.0, 1.0, ballHit);
  ballHit = 1.0 - ballHit;

  planeNoise += ballHit * 0.1;

  vec3 pPlane = p - vec3(0.0, planeY + planeNoise, 0.0);
  float plane = sdPlane(pPlane);

  float normalMixer = cos(time * 5.0) * 0.5 + 0.5;
  normalMixer = gain(normalMixer, 3.0);

  float orbeHit = getOrbeHit(p);

  float smoothHit = opSmoothUnion(orbeHit, plane, 1.5) + 0.2;
  float hit = mix3(orbeHit, smoothHit, plane, normalMixer);

  return hit;
}

#pragma glslify: export(getSceneHit)
