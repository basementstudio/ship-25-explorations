precision highp float;

uniform sampler2D uFlowFeedBackTexture;
uniform vec2 uMouse;
uniform float uTime;
uniform vec2 uResolution;
uniform int uFrame;
uniform float uMouseVelocity;

varying vec2 vUv;

float valueRemap(
  float value,
  float min,
  float max,
  float newMin,
  float newMax
) {
  return newMin + (value - min) * (newMax - newMin) / (max - min);
}

void main() {
  float mouseInfluence = valueRemap(uMouseVelocity, 0.0, 0.1, 0.0, 1.0);
  mouseInfluence = clamp(mouseInfluence, 0.0, 1.0);

  vec3 e = vec3(vec2(1.0) / uResolution.xy, 0.0);
  vec2 q = gl_FragCoord.xy / uResolution.xy;

  vec4 c = texture2D(uFlowFeedBackTexture, q);

  float p11 = c.y;

  float p10 = texture2D(uFlowFeedBackTexture, q - e.zy).x;
  float p01 = texture2D(uFlowFeedBackTexture, q - e.xz).x;
  float p21 = texture2D(uFlowFeedBackTexture, q + e.xz).x;
  float p12 = texture2D(uFlowFeedBackTexture, q + e.zy).x;

  float d = 0.0;

  float mouseMin = 10.5;
  float mouseMax = 0.0;

  d =
    smoothstep(
      mouseMin,
      mouseMax,
      length(uMouse.xy * uResolution.xy - gl_FragCoord.xy)
    ) *
    mouseInfluence *
    10.1;

  // automatic sin wave
  vec2 sinWavePos =
    vec2(sin(uTime * 2.23436197) * 1.5, cos(uTime * 3.1343121)) * 0.2;
  float sDist = length(sinWavePos - vUv + vec2(0.5) + vec2(0.0, 0.2));
  sDist = valueRemap(sDist, 0.0, 0.03, 1.0, 0.0);
  sDist = clamp(sDist, 0.0, 1.0);
  d += sDist;

  // The actual propagation:
  // The actual propagation:
  d += -(p11 - 0.5) * 2.0 + (p10 + p01 + p21 + p12 - 2.0);
  d *= 0.995; // damping
  d = d * 0.5 + 0.5;

  // Put previous state as "y":
  gl_FragColor = vec4(d, c.x, 0, 1);
}
