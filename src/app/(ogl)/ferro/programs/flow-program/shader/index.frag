#version 300 es

precision highp float;

#pragma glslify: cnoise3d = require('glsl-noise/classic/3d')

in vec2 vUv;

uniform sampler2D uFlowFeedBackTexture;
uniform vec2 uMouse;
uniform float uTime;

out vec4 fragColor;

#pragma glslify: packRGB = require('../../glsl-shared/pack-rgb')
#pragma glslify: unpackRGB = require('../../glsl-shared/unpack-rgb')

void main() {
  float flowSample = unpackRGB(texture(uFlowFeedBackTexture, vUv).rgb);
  float noise = cnoise3d(vec3(vUv * 20.0, uTime * 0.1));

  float sdf = distance(vUv, uMouse) * 5.0;
  sdf += noise * 0.001;
  sdf = pow(sdf, 0.5);

  sdf = clamp(sdf, 0.0, 1.0);
  // sdf = smoothstep(0.0, 1.0, sdf);
  sdf = 1.0 - sdf;
  sdf *= 2.0;

  // sdf *= 0.1;

  flowSample -= 0.01;
  // flowSample = mix(flowSample, sdf, 0.1);
  flowSample = max(flowSample, sdf);

  // flowSample += sdf * 0.1;

  flowSample = clamp(flowSample, 0.0, 0.999);
  fragColor = vec4(packRGB(flowSample), 1.0);
}
