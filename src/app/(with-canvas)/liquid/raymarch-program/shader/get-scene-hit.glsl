#pragma glslify: cnoise4d = require('glsl-noise/classic/4d')

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
  float planeY = 0.1;

  float noiseSample = cnoise4d(vec4(p * 2.0, time * 4.0));
  float noiseSample2 = cnoise4d(vec4(p * 10.0, 0.0));

  float planeNoise = noiseSample;
  float planeNoiseScale = 0.3;
  planeNoise *= planeNoiseScale;

  planeNoise += noiseSample2 * 0.05;

  vec3 pPlane = p - vec3(0.0, planeY + planeNoise, 0.0);
  float plane = sdPlane(pPlane);

  return plane;
}

#pragma glslify: export(getSceneHit)
