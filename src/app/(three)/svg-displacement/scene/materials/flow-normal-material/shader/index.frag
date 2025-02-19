precision highp float;

uniform sampler2D uHeightmap;

varying vec2 vUv;

float valueRemap(
  float value,
  float min,
  float max,
  float newMin,
  float newMax
) {
  return newMin + (value - min) * (newMax - newMin) / (max - min);
}

vec2 heightToNormal(vec2 uv, float tSize) {
  float height = texture2D(uHeightmap, uv).r; // Use the X channel for height
  float heightX = texture2D(uHeightmap, uv + vec2(1.0 / tSize, 0.0)).r;
  float heightY = texture2D(uHeightmap, uv + vec2(0.0, 1.0 / tSize)).r;

  float dx = heightX - height;
  float dy = heightY - height;

  vec2 normal = normalize(vec2(dx, dy));
  normal = normal * 0.5 + 0.5; // Map to range [0, 1]

  return normal;
}

void main() {
  vec2 uv = vUv;

  vec2 normal = heightToNormal(uv, 1024.0);
  gl_FragColor = vec4(normal, 0.0, 1.0);
}
