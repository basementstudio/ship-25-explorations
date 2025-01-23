#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;

// inside
uniform sampler2D uInsideDepthTexture;
uniform sampler2D uInsideColorTexture;

// outside
uniform sampler2D uOutsideDepthTexture;
uniform sampler2D uOutsideColorTexture;

// raymarch
uniform sampler2D uRaymarchTexture;
uniform sampler2D uRaymarchDepthTexture;

// camera
uniform float uNear;
uniform float uFar;

// others
uniform float uTime;
uniform sampler2D uNoise;

// automatically set by ogl
uniform vec3 cameraPosition;

in vec2 vUv;

out vec4 fragColor;

void main() {
  fragColor = vec4(1.0);

  float mask = texture(uOutsideDepthTexture, vUv).a;

  vec3 insideColor = texture(uInsideColorTexture, vUv).rgb;
  vec4 raymarchColor = texture(uRaymarchTexture, vUv);

  insideColor = mix(insideColor, raymarchColor.rgb, raymarchColor.a);

  vec3 outsideColor = texture(uOutsideColorTexture, vUv).rgb;

  vec3 env = outsideColor + insideColor;

  fragColor = vec4(env, 1.0);
}
