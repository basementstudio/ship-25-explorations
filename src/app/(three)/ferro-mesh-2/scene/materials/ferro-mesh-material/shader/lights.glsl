uniform sampler2D uEnvMap;
uniform sampler2D uEnvMap2;

uniform samplerCube envMap;
uniform mat3 envMapRotation;

#pragma glslify: valueRemap = require('../../glsl-shared/value-remap.glsl')

vec2 normalToEnvUv(vec3 normal) {
  // Normalize the vector (ensure it's unit length)
  vec3 n = normalize(normal);

  // Standard equirectangular mapping for HDRIs
  // phi: azimuthal angle (around y-axis) - maps to U coordinate
  // theta: polar angle (from y-axis) - maps to V coordinate
  float phi = atan(n.z, n.x);
  float theta = acos(n.y);

  // Map to [0,1] range for texture coordinates
  vec2 uv = vec2(
    (phi + 3.14159265359) / (2.0 * 3.14159265359), // Map phi from [-PI, PI] to [0, 1]
    theta / 3.14159265359 // Map theta from [0, PI] to [0, 1]
  );

  return uv;
}

vec4 textureGood(sampler2D sam, vec2 uv) {
  vec2 texelSize = vec2(1.0) / vec2(textureSize(sam, 0));
  uv = uv / texelSize - 0.5;
  vec2 iuv = floor(uv);
  vec2 f = fract(uv);
  f = f * f * (3.0 - 2.0 * f);
  vec4 rg1 = textureLod(sam, (iuv + vec2(0.5, 0.5)) * texelSize, 0.0);
  vec4 rg2 = textureLod(sam, (iuv + vec2(1.5, 0.5)) * texelSize, 0.0);
  vec4 rg3 = textureLod(sam, (iuv + vec2(0.5, 1.5)) * texelSize, 0.0);
  vec4 rg4 = textureLod(sam, (iuv + vec2(1.5, 1.5)) * texelSize, 0.0);
  return mix(mix(rg1, rg2, f.x), mix(rg3, rg4, f.x), f.y);
}

vec4 textureGaussian(sampler2D sam, vec2 uv) {
  // Gaussian kernel weights for 3x3
  float kernel[9] = float[](
    0.0625,
    0.125,
    0.0625,
    0.125,
    0.25,
    0.125,
    0.0625,
    0.125,
    0.0625
  );

  vec2 texelSize = vec2(1.0) / vec2(textureSize(sam, 0));
  vec4 result = vec4(0.0);

  int index = 0;
  for (int i = -1; i <= 1; i++) {
    for (int j = -1; j <= 1; j++) {
      vec2 offset = vec2(float(i), float(j)) * texelSize;
      result += texture(sam, uv + offset) * kernel[index];
      index++;
    }
  }

  return result;
}

float desaturate(vec3 col) {
  return dot(col, vec3(0.299, 0.587, 0.114));
}

vec3 getEnv2(vec2 uv) {
  // displace the env in the X axis
  vec3 envSample = texture(uEnvMap2, uv).rgb;
  envSample = pow(envSample, vec3(2.0));
  return envSample;
}

vec3 getEnv3(vec3 normal) {
  vec4 envColor = texture(envMap, envMapRotation * normal);

  return envColor.rgb;
}

vec2 textureScale = vec2(1.0, 1.0);

vec3 ambientLightDir = normalize(vec3(0.0, -0.7, 0.4));
float ambientLightIntensity = 0.4;

float getFresnel(
  vec3 normal,
  vec3 viewDir,
  float fresnelBias,
  float fresnelScale
) {
  float fresnelFactor =
    fresnelBias +
    fresnelScale * pow(1.0 - dot(normal, normalize(viewDir)), 3.0);

  return fresnelFactor;
}

vec4 getLights(vec3 normal, vec3 cameraPosition, vec3 worldPosition) {
  vec3 cameraToVertex = normalize(worldPosition - cameraPosition);
  vec3 reflectedNormal = reflect(cameraToVertex, normal);

  vec2 envUv = normalToEnvUv(reflectedNormal);

  vec3 col = vec3(0.0);

  float lightAmbient = dot(normal, ambientLightDir) * ambientLightIntensity;
  lightAmbient = clamp(lightAmbient, 0.0, 1.0);

  col -= lightAmbient;

  vec3 env = getEnv3(reflectedNormal);
  float fresnel = getFresnel(normal, cameraToVertex, 0.1, 0.2);

  // env *= fresnel;

  col += env;

  // fade out
  float alpha = 1.0;

  float alphaMultiplier = clamp(
    1.0 - pow(abs(worldPosition.z), 1.0) * 0.6,
    0.0,
    1.0
  );

  alphaMultiplier *= clamp(1.0 - length(worldPosition.xz) * 0.5, 0.0, 1.0);

  if (worldPosition.z > 0.0) {
    col *= alphaMultiplier;
  } else {
    col *= alphaMultiplier;
  }

  // return vec4(col, alpha);

  float debug = normal.y;

  // return vec4(vec3(cameraToVertex), 1.0);
  // return vec4(vec3(fresnel) * 0.2 * alphaMultiplier + col, 1.0);

  return vec4(col, 1.0);
}

#pragma glslify: export(getLights)
