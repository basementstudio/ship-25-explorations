// Constants
const float PYRAMID_RADIUS = 0.33;
const float PYRAMID_HEIGHT = 0.48;
const float NORMAL_EPSILON = 0.01;

// Utility functions
float f1(float x) {
  return 1.0 - sqrt(x * x + 0.001);
}

float f2(float x, float t) {
  return sqrt(x * x + t) - sqrt(t);
}

float f3(float x) {
  return f2(x - 1.0, 0.1) * 1.1;
}

float f4(float x) {
  return mix(f1(x), f3(x), smoothstep(0.0, 1.0, x));
}

// Calculate pyramid height at a given point
float calculatePyramid(float x, float y) {
  float dist = length(vec2(x, y)) / PYRAMID_RADIUS;
  dist = clamp(dist, 0.0, 1.0);
  return f4(dist) * PYRAMID_HEIGHT;
}

#pragma glslify: export(calculatePyramid)
