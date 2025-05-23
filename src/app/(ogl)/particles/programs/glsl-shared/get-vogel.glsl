#pragma glslify: PI = require(glsl-constants/PI)
const float goldenAngle = PI * (3.0 - sqrt(5.0)); // Golden angle in radians

vec2 getVogel(float diskSize, float i, float totalSamples, float rotation) {
  float cosAngle = cos(rotation);
  float sinAngle = sin(rotation);

  float r = diskSize * sqrt(float(i) / float(totalSamples));
  float theta = float(i) * goldenAngle;

  vec2 offset;
  offset.x = r * cos(theta);
  offset.y = r * sin(theta);

  vec2 rotatedOffset;
  rotatedOffset.x = cosAngle * offset.x - sinAngle * offset.y;
  rotatedOffset.y = sinAngle * offset.x + cosAngle * offset.y;

  return rotatedOffset;
}

#pragma glslify: export(getVogel)
