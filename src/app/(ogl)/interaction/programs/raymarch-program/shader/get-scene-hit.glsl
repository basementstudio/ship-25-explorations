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

float getNoise(vec3 p) {
  float n = sin(p.x * 20.0) * 0.5 + 0.5 + (sin(p.z * 20.0) * 0.5 + 0.5);
  n *= 0.5;
  return n;
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

  float ballHit = length(p - uHitPosition) * 2.0 - noiseSampleBig * 0.5;
  ballHit = clamp(ballHit, 0.0, 1.0);
  ballHit = smoothstep(0.0, 1.0, ballHit);
  ballHit = 1.0 - ballHit;

  planeNoise += ballHit * 0.1;

  vec3 pPlane = p - vec3(0.0, planeY + planeNoise, 0.0);
  float plane = sdPlane(pPlane);

  return plane;
}

#pragma glslify: export(getSceneHit)
