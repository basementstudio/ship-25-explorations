precision highp float;

#pragma glslify: cnoise = require('glsl-noise/classic/2d')

uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform float uColor1Size;
uniform float uColor2Size;
uniform float uColor3Size;
uniform float uColor4Size;
uniform float uMaskRadius;
uniform float uMaskSmoothness;
uniform float uMaskInvert;
uniform float uMaskPositionX;
uniform float uMaskPositionY;
uniform vec3 uColorAccent;
uniform vec2 uPlaneRes;
uniform vec2 uMouse2D;
uniform float uLinesBlur;
uniform float uNoise;
uniform float uOffsetX;
uniform float uOffsetY;
uniform float uLinesAmount;
uniform float uBackgroundScale;

uniform float uTime;
varying vec2 vUv;

#define PI 3.14159265359;

float lines(vec2 uv, float offset) {
  float a = abs(0.5 * sin(uv.y * uLinesAmount) + offset * uLinesBlur);
  return smoothstep(0.0, uLinesBlur + offset * uLinesBlur, a);
}

mat2 rotate2d(float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

float random(vec2 p) {
  vec2 k1 = vec2(
    23.14069263277926, // e^pi (Gelfond's constant)
    2.665144142690225 // 2^sqrt(2) (Gelfond–Schneider constant)
  );
  return fract(cos(dot(p, k1)) * 12345.6789);
}

vec3 fadeLine(
  vec2 uv,
  vec2 mouse2D,
  vec3 col1,
  vec3 col2,
  vec3 col3,
  vec3 col4,
  vec3 col5,
  float maskRadius,
  float maskSmoothness,
  float maskInvert,
  float maskPositionX,
  float maskPositionY
) {
  mouse2D = (mouse2D + 1.0) * 0.5;
  float n1 = cnoise(uv); //(*|/ ) -> scale (+|-) -> offset
  float n2 = cnoise(uv + uOffsetX * 20.0);
  float n3 = cnoise(uv * 0.3 + uOffsetY * 10.0);
  float nFinal = mix(mix(n1, n2, mouse2D.x), n3, mouse2D.y);
  vec2 baseUv = vec2(nFinal + 2.05) * uBackgroundScale; // (+|-) -> frequency (*|/ ) -> lines count

  float basePattern = lines(baseUv, uColor1Size);
  float secondPattern = lines(baseUv, uColor2Size);
  float thirdPattern = lines(baseUv, uColor3Size);
  float fourthPattern = lines(baseUv, uColor4Size);

  vec3 baseColor = mix(col1, col2, basePattern);
  vec3 secondBaseColor = mix(baseColor, col3, secondPattern);
  vec3 thirdBaseColor = mix(secondBaseColor, col4, thirdPattern);
  vec3 fourthBaseColor = mix(thirdBaseColor, col5, fourthPattern);

  // add white to fourthBaseColor
  fourthBaseColor = mix(fourthBaseColor, vec3(1.0), 0.2); // Add 20% white

  // add saturation to fourthBaseColor
  vec3 luminance = vec3(0.299, 0.587, 0.114);
  float lum = dot(fourthBaseColor, luminance);
  vec3 saturatedColor = mix(vec3(lum), fourthBaseColor, 1.5); // Increase saturation by 50%
  fourthBaseColor = saturatedColor;

  // Create a circular mask
  vec2 center = vec2(maskPositionX, maskPositionY);
  float radius = uMaskRadius;
  float dist = distance(uv, center);
  float mask = smoothstep(radius, radius - uMaskSmoothness, dist);

  if (maskInvert == 1.0) {
    mask = 1.0 - mask;
  }

  // Apply the mask to create a sphere-like effect
  vec3 sphereColor = mix(vec3(0.0), fourthBaseColor, mask);

  return fourthBaseColor * mask;

}

void main() {
  vec2 mouse2D = uMouse2D;

  vec2 uv = vUv;
  uv.y += uOffsetY;
  uv.x += uOffsetX;
  uv.x *= uPlaneRes.x / uPlaneRes.y; // Takes care of aspect ratio

  vec3 col1 = fadeLine(
    uv,
    mouse2D,
    uColor1,
    uColor2,
    uColor3,
    uColor4,
    uColorAccent,
    uMaskRadius,
    uMaskSmoothness,
    uMaskInvert,
    uMaskPositionX,
    uMaskPositionY
  );
  vec3 finalCol = col1;

  vec2 uvRandom = vUv;
  uvRandom.y *= random(vec2(uvRandom.y, 0.5));
  finalCol.rgb += random(uvRandom) * uNoise;

  gl_FragColor = vec4(finalCol, 1.0);
}
