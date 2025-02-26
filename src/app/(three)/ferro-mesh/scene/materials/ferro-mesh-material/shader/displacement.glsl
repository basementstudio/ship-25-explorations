// Calculate surface displacement

#pragma glslify: PI = require(glsl-constants/PI)

#pragma glslify: getVogel = require(../../glsl-shared/get-vogel.glsl)
#pragma glslify: valueRemap = require(../../glsl-shared/value-remap.glsl)

vec3 pyramid(
  vec3 p,
  vec3 pyramidCenter,
  float pyramidRadius,
  float pyramidHeight
) {
  float d = length(p - pyramidCenter) / pyramidRadius;

  d = clamp(d, 0.0, 1.0);
  d = smoothstep(0.0, 1.0, d);
  d = 1.0 - d;
  d = d * pyramidHeight;

  p.y += d;

  return p;
}

const int numPyramids = 30;

const float diskRadius = 0.7;

vec3 displacement(vec3 p) {
  p = pyramid(p, vec3(0.0), 0.4, 0.5);

  for (int i = 1; i < numPyramids; i++) {
    vec2 vogel = getVogel(diskRadius, float(i), float(numPyramids), 0.0);
    vec3 center = vec3(vogel.x, 0.0, vogel.y);

    float h = valueRemap(length(center), 0.0, diskRadius, 0.5, 0.2);

    p = pyramid(p, center, 0.2, h);
  }

  return p;
}

#pragma glslify: export(displacement)
