const float pi = 3.1415926535897932384626433832795;
const float goldenAngle = pi * (3.0 - sqrt(5.0)); // Golden angle in radians
const float diskSize = 80.0;

vec3 rand(vec2 uv) {
  return vec3(
    fract(sin(dot(uv, vec2(12.75613, 38.12123))) * 13234.76575),
    fract(sin(dot(uv, vec2(19.45531, 58.46547))) * 43678.23431),
    fract(sin(dot(uv, vec2(23.67817, 78.23121))) * 93567.23423)
  );
}

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
