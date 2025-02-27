// Calculate surface displacement

#pragma glslify: PI = require(glsl-constants/PI)

#pragma glslify: getVogel = require(../../glsl-shared/get-vogel.glsl)
#pragma glslify: valueRemap = require(../../glsl-shared/value-remap.glsl)

uniform float uDiskRadius;
uniform float uHeightMax;
uniform float uHeightMin;

vec3 pyramid(
  vec3 p,
  vec3 pyramidCenter,
  float pyramidRadius,
  float pyramidHeight
) {
  float d = length(vec3(p.x, 0.0, p.z) - pyramidCenter) / pyramidRadius;

  d = clamp(d, 0.0, 1.0);
  d = smoothstep(0.0, 1.0, d);
  // d = pow(d, 0.7);
  d = 1.0 - d;
  d = d * pyramidHeight;

  p.y = max(p.y, d);

  return p;
}

const int numPyramids = 30;

vec3 displacement(vec3 p) {
  p = pyramid(p, vec3(0.0), 0.4, 0.5);

  for (int i = 1; i < numPyramids; i++) {
    vec2 vogel = getVogel(1.0, float(i), float(numPyramids), 0.0);

    float d = length(vogel);

    float size = valueRemap(d, 0.0, 1.0, uHeightMax, uHeightMin);

    vec3 center = normalize(vec3(vogel.x, 0.0, vogel.y));

    center *= pow(d, 0.8) * uDiskRadius;

    p = pyramid(p, center, size, size);
  }

  return p;
}

#pragma glslify: export(displacement)
