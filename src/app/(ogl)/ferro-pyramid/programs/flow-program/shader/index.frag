#version 300 es

precision highp float;

#pragma glslify: cnoise3d = require('glsl-noise/classic/3d')

in vec2 vUv;

uniform sampler2D uFlowFeedBackTexture;
uniform vec2 uMouse;
uniform float uTime;

out float fragColor;

void main() {
  float flowSample = texture(uFlowFeedBackTexture, vUv).r;
  float noise = cnoise3d(vec3(vUv * 20.0, uTime * 0.1));

  float sdf = distance(vUv, uMouse) * 6.0;
  sdf += noise * 0.1;

  sdf = clamp(sdf, 0.0, 1.0);
  // sdf = smoothstep(0.0, 1.0, sdf);
  sdf = 1.0 - sdf;
  sdf *= 2.0;

  // sdf *= 0.1;

  flowSample -= 0.001;
  flowSample = mix(flowSample, sdf, 0.1);

  flowSample = clamp(flowSample, 0.0, 2.0);
  fragColor = flowSample;
}
