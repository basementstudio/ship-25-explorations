precision highp float;

// uniforms
uniform sampler2D uHeightmap;
uniform vec3 cameraPosition;
uniform sampler2D uMatcap;
uniform samplerCube envMap;
uniform mat3 envMapRotation;

// inout
in vec3 vWorldPosition;
in vec2 vUv;
out vec4 fragColor;

// remap functions
float valueRemap(
  float value,
  float min,
  float max,
  float newMin,
  float newMax
) {
  return newMin + (value - min) * (newMax - newMin) / (max - min);
}

vec3 heightToNormal(vec2 uv, float tSize) {
  float height = texture(uHeightmap, uv).r; // Use the X channel for height
  float heightX = texture(uHeightmap, uv + vec2(1.0 / tSize, 0.0)).r;
  float heightY = texture(uHeightmap, uv + vec2(0.0, 1.0 / tSize)).r;

  float dx = heightX - height;
  float dy = heightY - height;

  vec3 normal = vec3(dx, 0.1, dy);
  return normalize(normal);
}

// lights
vec3 sampleMatcap(vec3 reflected) {
  float m = 2.8284271247461903 * sqrt(reflected.z + 1.0);
  vec2 uv = reflected.xy / m + 0.5;
  vec3 mat = texture(uMatcap, uv).rgb;

  return mat;
}

vec3 getEnv3(vec3 normal) {
  vec4 envColor = texture(envMap, envMapRotation * normal);
  return envColor.rgb;
}

// main
void main() {
  vec2 uv = vUv;
  vec3 normal = heightToNormal(uv, float(textureSize(uHeightmap, 0)));

  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  vec3 reflectedNormal = reflect(viewDirection, normal);

  vec3 color = vec3(1.0);

  vec3 env = getEnv3(reflectedNormal);

  vec3 matcap = sampleMatcap(reflectedNormal);

  color = matcap;

  fragColor = vec4(color, 1.0);
}
