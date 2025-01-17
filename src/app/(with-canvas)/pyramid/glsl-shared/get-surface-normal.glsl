#pragma glslify: snoise2 = require('glsl-noise/classic/2d')

const float sampleShift = 0.01;
const float scale = 400.0;

vec2 getSurfaceNormal(vec2 centerUv) {
  vec2 sampleUv = centerUv * scale;
  // Sample noise at center and offset points
  float center = snoise2(sampleUv);
  float right = snoise2(sampleUv + vec2(sampleShift, 0.0));
  float top = snoise2(sampleUv + vec2(0.0, sampleShift));

  // Calculate the gradient by comparing differences
  float dx = right - center; // X direction gradient
  float dy = top - center; // Y direction gradient

  return vec2(dx, dy) / sampleShift; // Normalize by sample distance
}

#pragma glslify: export(getSurfaceNormal)
