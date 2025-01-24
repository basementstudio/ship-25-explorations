#pragma glslify: cnoise4d = require('glsl-noise/classic/4d')

uniform vec3 uHitPosition;
uniform float noiseScale;
uniform float noiseLength;

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

float getSceneHit(vec3 p) {
  float planeY = 0.0;

  float noiseSampleBig = cnoise4d(
    vec4((p + vec3(time * 1.0, sin(time), 0.0)) * 1.0, time * 0.5)
  );

  float noiseSampleSmall = cnoise4d(
    vec4((p + uHitPosition * 0.1) * noiseScale * vec3(1.0, 0.0, 1.0), 0.0)
  );
  noiseSampleSmall *= noiseSampleSmall;

  float planeNoise = noiseSampleSmall * noiseLength;

  float hitDistance = length(p - uHitPosition) * 2.0;
  hitDistance = clamp(hitDistance, 0.0, 1.0);
  hitDistance = smoothstep(0.0, 1.0, hitDistance);
  planeNoise *= 1.0 - hitDistance;

  vec3 pPlane = p - vec3(0.0, planeY + planeNoise, 0.0);
  float plane = sdPlane(pPlane);

  return plane;
}

#pragma glslify: export(getSceneHit)
