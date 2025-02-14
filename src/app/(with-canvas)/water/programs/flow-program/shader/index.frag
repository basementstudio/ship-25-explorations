#version 300 es

precision highp float;

in vec2 vUv;

uniform sampler2D uFlowFeedBackTexture;
uniform vec2 uMouse;
uniform float uTime;
uniform vec2 uResolution;
uniform int uFrame;
uniform float uMouseVelocity;

out vec4 fragColor;

void main() {
  float dx = 1.0 / uResolution.x;
  float dy = 1.0 / uResolution.y;

  vec2 elevationAndVelocity = texture(uFlowFeedBackTexture, vUv).xy;

  // Mouse excitation based on distance in UV units
  float distanceToMouse = distance(gl_FragCoord.xy, uMouse * uResolution);

  if (distanceToMouse < 10.0 && uMouseVelocity > 0.001) {
    fragColor = vec4(0.0, 0.4, 0.0, 1.0);
    return;
  }

  // Old elevation
  float previousElevation = elevationAndVelocity.x;
  // Old velocity
  float previousVelocity = elevationAndVelocity.y;

  // Finite differences
  float elevationRight = texture(
    uFlowFeedBackTexture,
    vec2(vUv.x + dx, vUv.y)
  ).x;
  float elevationLeft = texture(
    uFlowFeedBackTexture,
    vec2(vUv.x - dx, vUv.y)
  ).x;
  float elevationUp = texture(uFlowFeedBackTexture, vec2(vUv.x, vUv.y + dy)).x;
  float elevationDown = texture(
    uFlowFeedBackTexture,
    vec2(vUv.x, vUv.y - dy)
  ).x;

  float dampingFactor = 0.99;

  // New elevation
  float newElevation =
    previousElevation +
    previousVelocity +
    0.2 *
      (elevationLeft +
        elevationRight +
        elevationUp +
        elevationDown -
        4.0 * previousElevation);
  newElevation = dampingFactor * newElevation;

  // Store elevation and velocity
  fragColor = vec4(newElevation, newElevation - previousElevation, 0.0, 1.0);
}
