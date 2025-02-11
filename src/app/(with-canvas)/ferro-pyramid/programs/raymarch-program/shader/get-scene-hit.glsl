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

float getSinCos(vec3 pos, float flow) {
  vec3 p = pos;

  float shiftInlfuence = p.y * 10.0;

  p -= uHitPosition;
  float dist = length(p);
  vec3 direction = normalize(p);

  float dist2 = dist - 0.01;
  dist2 = max(dist2, 0.0);
  p.xz -= direction.xz * shiftInlfuence * dist2 * 0.1;

  p += uHitPosition;

  p += uHitPosition * 0.2;
  float sinCos = sin(p.x * 50.0) * cos(p.z * 50.0);
  return sinCos;
}

float getSceneHit(vec3 p) {
  float planeY = 0.0;
  float flow0 = getFlowHit(p);
  float flow = flow0;

  float sinCos = getSinCos(p, flow);
  flow = smoothstep(0.0, 0.2, flow) * sinCos * 0.5;
  flow *= 0.1;

  float f1 = pow(flow0, 0.5) * smoothstep(0.0, 1.0, flow0);
  flow += f1 * 0.2;

  planeY += flow;

  vec3 pPlane = p - vec3(0.0, planeY, 0.0);
  float plane = sdPlane(pPlane);

  return plane;
}

#pragma glslify: export(getSceneHit)
