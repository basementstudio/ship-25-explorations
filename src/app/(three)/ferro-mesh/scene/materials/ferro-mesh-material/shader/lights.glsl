uniform sampler2D uEnvMap;
uniform sampler2D uEnvMap2;

#pragma glslify: valueRemap = require('../../glsl-shared/value-remap.glsl')

vec2 normalToEnvUv(vec3 normal) {
  // Normalize the vector (ensure it's unit length)
  vec3 n = normalize(normal);

  // Convert to spherical coordinates
  // u = atan(x,z) / (2*PI) + 0.5 -> This maps [-π,π] to [0,1]
  // v = acos(y) / PI -> This maps [0,π] to [0,1]
  vec2 uv = vec2(
    atan(n.x, n.z) * 0.15915494309189533576888376337251 + 0.5, // 0.159... is 1/(2*PI)
    acos(n.y) * 0.318309886183790671537767526745 // 0.318... is 1/PI
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

float getFresnel(vec3 normal, vec3 viewDir) {
  // fresnel
  float ft = dot(normal, normalize(vec3(0.0, 0.0, 1.0)));
  float fresnelValue = smoothstep(0.6, 1.0, min(1.0, pow(1.0 - ft, 2.0)));
  return fresnelValue;
}

float desaturate(vec3 col) {
  return dot(col, vec3(0.299, 0.587, 0.114));
}

vec3 getEnv2(vec3 normal) {
  vec2 uv = normalToEnvUv(normal);
  uv.y = 1.0 - uv.y;
  return textureGood(uEnvMap2, uv).rgb;
}

vec2 textureScale = vec2(1.0, 1.0);

vec3 ambientLightDir = normalize(vec3(0.0, 0.7, 1.0));
float ambientLightIntensity = 0.4;

vec4 getLights(vec3 normal, vec3 viewDir) {
  vec2 uv = normalToEnvUv(normal);

  vec3 reflectedNormal = reflect(viewDir, normal);

  vec3 col = vec3(0.0);

  float lightAmbient = dot(normal, ambientLightDir) * ambientLightIntensity;
  lightAmbient = clamp(lightAmbient, 0.0, 1.0);

  col += lightAmbient;

  vec3 env = getEnv2(reflectedNormal);
  // env *= pow(clamp(1.0 - dot(normal, vec3(0.0, 1.0, 0.0)), 0.0, 1.0), 0.2);
  env *= smoothstep(1.0, 0.9, dot(normal, vec3(0.0, 1.0, 0.0)));
  col += env;

  float fresnel = getFresnel(normal, viewDir);

  // fade out
  float alpha = 1.0;

  float alphaMultiplier = clamp(
    1.0 - pow(abs(worldPosition.z), 1.0) * 0.6,
    0.0,
    1.0
  );

  if (worldPosition.z > 0.0) {
    col *= alphaMultiplier;
  } else {
    alpha *= alphaMultiplier;
  }

  return vec4(col, alpha);
}

#pragma glslify: export(getLights)
