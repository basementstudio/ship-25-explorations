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
  vec3 e = vec3(vec2(1.0) / uResolution.xy, 0.0);
  vec2 q = gl_FragCoord.xy / uResolution.xy;

  vec4 c = texture(uFlowFeedBackTexture, q);

  float p11 = c.y;

  float p10 = texture(uFlowFeedBackTexture, q - e.zy).x;
  float p01 = texture(uFlowFeedBackTexture, q - e.xz).x;
  float p21 = texture(uFlowFeedBackTexture, q + e.xz).x;
  float p12 = texture(uFlowFeedBackTexture, q + e.zy).x;

  float d = 0.0;

  float mouseMin = 10.5;
  float mouseMax = 0.5;

  d =
    smoothstep(
      mouseMin,
      mouseMax,
      length(uMouse.xy * uResolution.xy - gl_FragCoord.xy)
    ) *
    uMouseVelocity *
    10.0;

  // The actual propagation:
  d += -(p11 - 0.5) * 2.0 + (p10 + p01 + p21 + p12 - 2.0);
  d *= 0.99; // damping
  d *= float(uFrame >= 2); // clear the buffer at iFrame < 2
  d = d * 0.5 + 0.5;

  // Put previous state as "y":
  fragColor = vec4(d, c.x, 0, 1);
}
