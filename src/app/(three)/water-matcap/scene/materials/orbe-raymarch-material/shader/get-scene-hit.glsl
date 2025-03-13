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

uniform mat4 uSphereMatrix;
uniform float uSphereMix;

float sdSphere(vec3 position, float radius) {
  return length(position) - radius;
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
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

float flowEdge = 0.05;

float getFlowHit2(vec3 p) {
  vec3 normal = normalize(p);
  float longitude = atan(normal.x, normal.z);
  float latitude = asin(normal.y);

  vec2 uv = vec2(
    0.5 + longitude / (2.0 * PI),
    0.5 - log(tan(PI / 4.0 + latitude / 2.0)) / PI
  );

  uv = clamp(uv, 0.0, 1.0);
  // uv.y = 1.0 - uv.y;
  float flow = texture(uFlowTexture, uv).x;

  // remap from 0-1 to -1-1
  flow *= 2.0;
  flow -= 1.0;

  flow *= 0.05;

  // smoot out to edges
  float edge = smoothstep(0.0, flowEdge, uv.x);
  edge *= smoothstep(0.0, flowEdge, uv.y);
  edge *= smoothstep(1.0, 1.0 - flowEdge, uv.x);
  edge *= smoothstep(1.0, 1.0 - flowEdge, uv.y);

  return flow;
}

float maxPoint = 0.2698;
float gainConstant = 1.0 / 2.0;

float getFlowHit(vec3 p) {
  vec2 uv = vec2(
    valueRemap(p.x, -maxPoint, maxPoint, 0.0, 1.0),
    valueRemap(p.z, -maxPoint, maxPoint, 0.0, 1.0)
  );
  uv = clamp(uv, 0.0, 1.0);
  uv = vec2(gain(uv.x, gainConstant), gain(uv.y, gainConstant));

  float flow = texture(uFlowTexture, uv).x;
  flow *= 2.0;
  flow -= 1.0;

  float edge = smoothstep(0.0, flowEdge, uv.x);
  edge *= smoothstep(0.0, flowEdge, uv.y);
  edge *= smoothstep(1.0, 1.0 - flowEdge, uv.x);
  edge *= smoothstep(1.0, 1.0 - flowEdge, uv.y);

  flow *= edge;

  return flow;
}

float getOrbeHit(vec3 p, float flow) {
  float pyramidShift = -0.1;
  p.y -= pyramidShift;

  vec3 flowShift = vec3(p.x, 0.0, p.z);
  flowShift *= 0.4;
  flowShift *= flow;
  p += flowShift;

  float pyramidScale = 0.5;

  float hit = sdPyramid(p / pyramidScale, 0.9) * pyramidScale;

  // round
  hit -= 0.001;

  return hit;
}

float getOrbe2hit(vec3 pIn, float flow) {
  vec3 p = (uSphereMatrix * vec4(pIn, 1.0)).xyz;

  float noise = getNoise(p.xz * 0.3).x;
  noise = max(noise, getNoise(p.xy * 0.3).x);

  flow *= valueRemap(uSphereMix, 0.0, 1.0, 1.0, 1.0);

  float n = noise * 0.05 + flow * 0.05;

  float hit = sdSphere(p, 0.25 + n);

  // return flow;
  return hit;
}

float getSceneHit(vec3 p) {
  vec3 pPyramid = (uPyramidMatrix * vec4(p, 1.0)).xyz;
  float flow = getFlowHit(pPyramid);

  float hit1 = getOrbeHit(pPyramid, flow);

  float hit2 = getOrbe2hit(p, flow);

  float hit = mix(hit1, hit2, uSphereMix);

  return hit * 0.3;
}

#pragma glslify: export(getSceneHit)
