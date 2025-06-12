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
uniform float uAspect;
uniform float focusCenter;

// automatically set by ogl
uniform vec3 cameraPosition;

#pragma glslify: valueRemap = require('../../glsl-shared/value-remap.glsl')
#pragma glslify: unpackRGB = require('../../glsl-shared/unpack-rgb.glsl')
// #pragma glslify: getVogel = require('../../glsl-shared/get-vogel.glsl')
#pragma glslify: depthModule = require('../../glsl-shared/depth.glsl', linearizeDepth=linearizeDepth)

in vec2 vUv;

out vec4 fragColor;

const float diskSize = 0.01;
const int totalSamples = 16;

// TODO move this into uniforms and make it based on the camera target
const float focusAmplitude = 0.01;
const float focusWidth = 0.01;

vec3 getBackground() {
  return vec3(valueRemap(vUv.y, 0.0, 1.0, 0.0, 0.3));
}

float getGaussian(float x, float sigma) {
  return exp(-x * x / (2.0 * sigma * sigma));
}

float getFocusFactor(sampler2D tex, vec2 uv) {
  float depth = linearizeDepth(unpackRGB(texture(tex, uv).rgb), uNear, uFar);
  depth = valueRemap(depth, uNear, uFar, 0.0, 1.0);

  float focus = abs(depth - focusCenter);
  focus -= focusWidth;
  focus = valueRemap(focus, 0.0, focusAmplitude, 0.0, 1.0);
  focus = clamp(focus, 0.0, 1.0);

  return focus;
}

#pragma glslify: PI = require(glsl-constants/PI)
const float goldenAngle = PI * (3.0 - sqrt(5.0)); // Golden angle in radians

vec2 getVogel(float i, float totalSamples, float rotation) {
  float cosAngle = cos(rotation);
  float sinAngle = sin(rotation);

  float r = sqrt(float(i) / float(totalSamples));
  float theta = float(i) * goldenAngle;

  vec2 offset;
  offset.x = r * cos(theta);
  offset.y = r * sin(theta);

  vec2 rotatedOffset;
  rotatedOffset.x = cosAngle * offset.x - sinAngle * offset.y;
  rotatedOffset.y = sinAngle * offset.x + cosAngle * offset.y;

  return rotatedOffset;
}

void main() {
  vec3 backgroundColor = getBackground();

  vec3 color = vec3(0.0);

  vec3 noiseSample = texture(uNoise, vUv * vec2(uAspect, 1.0) * 30.0).rgb;

  float totalWeight = 1.0;

  for (int i = 0; i < totalSamples; i++) {
    vec2 vogel = getVogel(
      float(i),
      float(totalSamples),
      (noiseSample.r - 0.5) * 2.0
      // noiseSample.r
    );

    vec3 env = vec3(0.0);

    float progress = float(i) / float(totalSamples);
    float center = 1.0 - progress;

    float vogelScale = diskSize * (progress * 0.5 + 0.5);

    vec2 vogelUv = vUv + vogel * vec2(1.0, uAspect) * vogelScale;
    float gaussian = getGaussian(progress, 0.1);

    // raymarch pass
    vec4 raymarchSample = texture(uRaymarchTexture, vogelUv);
    float raymarchFocus = getFocusFactor(uRaymarchDepthTexture, vogelUv);
    float raymarchInfluence = smoothstep(
      progress - 0.01,
      progress + 0.01,
      raymarchFocus
    );
    raymarchInfluence *= 1.0 - step(raymarchSample.a, 0.99999);
    raymarchInfluence *= gaussian;
    totalWeight += raymarchInfluence;
    env += raymarchSample.rgb * raymarchInfluence;

    // inside pass
    vec4 insideSample = texture(uInsideColorTexture, vogelUv);
    float insideFocus = getFocusFactor(uInsideDepthTexture, vogelUv);
    // float insideInfluence = step(progress, insideFocus);
    float insideInfluence = smoothstep(progress - 0.1, progress, insideFocus);
    // insideInfluence *= 1.0 - step(insideSample.a, 0.99999);
    insideInfluence *= 1.0 - raymarchSample.a; // disable if raymarch sample
    insideInfluence *= gaussian;
    totalWeight += insideInfluence;
    env += insideSample.rgb * insideInfluence;

    // outside pass
    vec4 outsideSample = texture(uOutsideColorTexture, vogelUv);
    float outsideFocus = getFocusFactor(uOutsideDepthTexture, vogelUv);
    float outsideInfluence = smoothstep(
      progress - 0.01,
      progress + 0.01,
      outsideFocus
    );
    outsideInfluence *= gaussian * 0.3;
    // outsideInfluence *= 1.0 - step(outsideSample.a, 0.99999);
    totalWeight += outsideInfluence;
    env += outsideSample.rgb * outsideInfluence;

    // vec3 env = insideColor + outsideColor + raymarchColor;

    color += env;
  }

  float minMult = 3.0;
  float maxMult = 1.0;

  float mult = valueRemap(totalWeight, 4.0, 7.0, minMult, maxMult);
  mult = clamp(mult, maxMult, minMult);
  color *= mult;

  // fragColor = vec4(vec3(totalWeight / 8.0), 1.0);
  fragColor = vec4(color, 1.0);

  // float focusFactor = getFocusFactor(uRaymarchDepthTexture, vUv);
  // fragColor = vec4(vec3(focusFactor), 1.0);

}
