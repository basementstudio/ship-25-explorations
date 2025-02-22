precision highp float;

uniform sampler2D uFlowFeedBackTexture;
uniform vec2 uMouse;
uniform float uTime;
uniform vec2 uResolution;
uniform int uFrame;
uniform float uMouseVelocity;
uniform vec2 uMouseDirection;

varying vec2 vUv;

#pragma glslify: valueRemap = require("../../glsl-shared/value-remap.glsl")

#pragma glslify: PI = require("glsl-constants/pi")

// Configs
float mouseMin = 20.5;
float mouseMax = 0.0;
float flowEdge = 0.2;

float getEdgeFactor() {
  float edge = smoothstep(0.0, flowEdge, vUv.x);
  edge *= smoothstep(1.0, 1.0 - flowEdge, vUv.x);
  edge *= smoothstep(1.0, 1.0 - flowEdge, vUv.y);
  edge *= smoothstep(0.0, flowEdge, vUv.y);

  return 1.0 - edge;
}

struct Mouse {
  float wave;
  float dirDist;
  float fromCenter;
  float step;
  float mixer;
};

Mouse getMouseWave() {
  vec2 mousePos = uMouse;
  vec2 mouseDir = normalize(uMouseDirection);
  float mouseInfluence = smoothstep(0.01, 1.5, uMouseVelocity);
  float clampedMouseInfluence = clamp(mouseInfluence, 0.5, 1.0);

  // debug
  // mousePos = vec2(0.5);
  // mouseDir = vec2(1.0, 1.0);

  float mouseWave = 0.0;
  float mouseRadius = 0.05 * clampedMouseInfluence;
  float invertedRadius = 1.0 / mouseRadius;

  float mouseDist = distance(mousePos, vUv);
  mouseDist /= mouseRadius;
  mouseDist = clamp(mouseDist, 0.0, 1.0);
  mouseDist = 1.0 - mouseDist;

  float stepMouse = smoothstep(0.0, 0.6, mouseDist);

  float dirMouseDist = dot(mouseDir, vUv - mousePos) * invertedRadius * PI;
  dirMouseDist = clamp(dirMouseDist, -PI, PI);
  dirMouseDist = sin(dirMouseDist);

  mouseWave = dirMouseDist * stepMouse * clampedMouseInfluence * 0.3;

  float mouseMixer = clamp(uMouseVelocity * 10.0, 0.0, 1.0);
  mouseMixer *= mouseDist * 0.2;

  return Mouse(mouseWave, dirMouseDist, mouseDist, stepMouse, mouseMixer);
}

void main() {
  if (uFrame < 3) {
    gl_FragColor = vec4(0.5, 0.5, 0.0, 0.0);
    return;
  }

  vec3 e = vec3(vec2(1.0) / uResolution.xy, 0.0);
  vec2 q = gl_FragCoord.xy / uResolution.xy;

  vec4 c = texture2D(uFlowFeedBackTexture, q);

  float p11 = c.y;

  float p10 = texture2D(uFlowFeedBackTexture, q - e.zy).x;
  float p01 = texture2D(uFlowFeedBackTexture, q - e.xz).x;
  float p21 = texture2D(uFlowFeedBackTexture, q + e.xz).x;
  float p12 = texture2D(uFlowFeedBackTexture, q + e.zy).x;

  float d = 0.0;

  // d =
  //   smoothstep(
  //     mouseMin,
  //     mouseMax,
  //     length(uMouse.xy * uResolution.xy - gl_FragCoord.xy)
  //   ) *
  //   mouseInfluence;

  // d = -smoothstep(0.0, 1.0, d);
  // d = clamp(d, -1.0, 0.0);

  // The actual propagation:
  d += -(p11 - 0.5) * 2.0 + (p10 + p01 + p21 + p12 - 2.0);

  // Add mouse
  Mouse mouse = getMouseWave();
  // mouseWave = clamp(mouseWave, 0.0, 0.05);
  // d += mouseWave;

  d = mix(d, mouse.wave, mouse.mixer);
  // if (mouseWave > 0.0) {
  //   d = mix(d, max(mouseWave * mouseInfluence, d), 0.9);
  // } else {
  //   d = mix(d, min(mouseWave * mouseInfluence, d), 0.9);
  // }

  // damping
  d *= 0.995;
  // edge damping
  float edge = getEdgeFactor();
  d = mix(d, 0.0, edge);
  // remap from -1-1 to 0-1
  d = d * 0.5 + 0.5;

  // Put previous state as "y":
  gl_FragColor = vec4(d, c.x, 0.0, 1.0);

  // gl_FragColor = vec4(mouse.wave, 0.0, 0.0, 1.0);

}
