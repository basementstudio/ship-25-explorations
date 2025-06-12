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
  float scale = 1080.0;
  uv = uv * scale - 0.5;
  vec2 iuv = floor(uv);
  vec2 f = fract(uv);
  f = f * f * (3.0 - 2.0 * f);
  vec4 rg1 = textureLod(sam, (iuv + vec2(0.5, 0.5)) / scale, 0.0);
  vec4 rg2 = textureLod(sam, (iuv + vec2(1.5, 0.5)) / scale, 0.0);
  vec4 rg3 = textureLod(sam, (iuv + vec2(0.5, 1.5)) / scale, 0.0);
  vec4 rg4 = textureLod(sam, (iuv + vec2(1.5, 1.5)) / scale, 0.0);
  return mix(mix(rg1, rg2, f.x), mix(rg3, rg4, f.x), f.y);
}

float getFresnel(vec3 normal, vec3 viewDir) {
  float cosTheta = dot(normal, viewDir);
  // float f0 = 0.04;
  // float f90 = 1.0;
  // return f0 + (f90 - f0) * pow(1.0 - cosTheta, 5.0);
  return cosTheta;
}

float desaturate(vec3 col) {
  return dot(col, vec3(0.299, 0.587, 0.114));
}

// vec2 textureScale = vec2(2.0, 4.0);
vec2 textureScale = vec2(2.0, 2.0);

vec3 getEnvColor(sampler2D envMap, vec3 normal, vec3 viewDir) {
  vec2 uv = normalToEnvUv(normal);
  uv.y = 1.0 - uv.y;

  vec3 col = textureGood(envMap, uv * textureScale).rgb;
  vec3 desat = vec3(desaturate(col));

  float fresnel = getFresnel(normal, -viewDir);
  fresnel *= 2.0;
  fresnel = clamp(fresnel, 0.0, 1.0);
  // fresnel = pow(fresnel, 2.0);
  col = mix(col, desat, fresnel);
  // col = pow(col, vec3(4.0));

  // return vec3(fresnel);
  return col;
}

#pragma glslify: export(getEnvColor)
