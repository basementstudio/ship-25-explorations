precision highp float;

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 wPos;
varying vec3 viewDirection;

varying vec2 vScreenUV;

uniform sampler2D uRaymarchTexture;
uniform sampler2D uDepthTexture;

#pragma glslify: glassColor = require('./glass.glsl', reflectionMap = uRaymarchTexture, time = time)
#pragma glslify: valueRemap = require('./value-remap.glsl')

const float diskSize = 0.04;

vec3 getColor() {
  vec4 baseSample = texture2D(uRaymarchTexture, vScreenUV);
  float depth = texture2D(uDepthTexture, vScreenUV).r;
  depth = valueRemap(depth, 0.1, 0.5, 0.0, 1.0);
  // depth = pow(depth, 0.5);
  depth = clamp(depth, 0.0, 1.0);
  depth = smoothstep(0.0, 1.0, depth);
  // depth = 1.0;

  vec4 color = glassColor(vScreenUV, depth * diskSize);
  color.rgb = mix(vec3(0.6), color.rgb, color.a);

  return color.rgb;
}

void main() {
  vec3 color = getColor();
  gl_FragColor = vec4(color, 1.0);
}
