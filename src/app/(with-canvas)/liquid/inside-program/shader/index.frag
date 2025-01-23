#version 300 es

precision highp float;

in vec3 vNormal;
in vec3 vViewNormal;
in vec2 vUv;
in vec3 wPos;
in vec3 viewDirection;

uniform vec3 cameraPosition;

// light
uniform sampler2D uEnvMap;

out vec4 FragData[2];

#pragma glslify: packRGB = require('../../glsl-shared/pack-rgb.glsl')

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
  uv = uv * 1024.0 - 0.5;
  vec2 iuv = floor(uv);
  vec2 f = fract(uv);
  f = f * f * (3.0 - 2.0 * f);
  vec4 rg1 = textureLod(sam, (iuv + vec2(0.5, 0.5)) / 1024.0, 0.0);
  vec4 rg2 = textureLod(sam, (iuv + vec2(1.5, 0.5)) / 1024.0, 0.0);
  vec4 rg3 = textureLod(sam, (iuv + vec2(0.5, 1.5)) / 1024.0, 0.0);
  vec4 rg4 = textureLod(sam, (iuv + vec2(1.5, 1.5)) / 1024.0, 0.0);
  return mix(mix(rg1, rg2, f.x), mix(rg3, rg4, f.x), f.y);
}

vec3 getEnvColor(vec3 normal) {
  vec2 uv = normalToEnvUv(normal);
  uv.y = 1.0 - uv.y;
  vec3 col = textureGood(uEnvMap, uv).rgb;
  col = pow(col, vec3(4.0));
  return col;
}

void main() {
  // pack depth into first channel
  FragData[0] = vec4(packRGB(gl_FragCoord.z), 1.0);

  vec3 reflectedNormal = reflect(viewDirection, normalize(vNormal));

  // pack color into second channel
  FragData[1] = vec4(getEnvColor(reflectedNormal), 1.0);
}
