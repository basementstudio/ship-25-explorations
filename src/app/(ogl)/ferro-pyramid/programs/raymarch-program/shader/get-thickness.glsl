#pragma glslify: depthModule = require('../../glsl-shared/depth.glsl', linearizeDepth = linearizeDepth, viewSpaceDepth = viewSpaceDepth)
#pragma glslify: valueRemap = require('../../glsl-shared/value-remap.glsl')

float getThickness(float insideZ, float outsideZ, float uNear, float uFar) {
  float insideDepthLinear = linearizeDepth(insideZ, uNear, uFar);
  float outsideLinearDepth = linearizeDepth(outsideZ, uNear, uFar);
  // distance from the surface to the inside side
  float depthDifference = insideDepthLinear - outsideLinearDepth;

  return depthDifference;
}

#pragma glslify: export(getThickness)
