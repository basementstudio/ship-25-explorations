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

#pragma glslify: PI = require("glsl-constants/PI")

// circular geometrical
float smin(float a, float b, float k) {
  k *= 1.0 / (1.0 - sqrt(0.5));
  return max(k, min(a, b)) - length(max(k - vec2(a, b), 0.0));
}

// Configs
float mouseMin = 20.5;
float mouseMax = 0.0;
float flowEdge = 0.1;

float getEdgeFactor() {
  float edge = smoothstep(0.0, flowEdge, vUv.x);
  edge *= smoothstep(1.0, 1.0 - flowEdge, vUv.x);
  edge *= smoothstep(1.0, 1.0 - flowEdge, vUv.y);
  edge *= smoothstep(0.0, flowEdge, vUv.y);
  edge = 1.0 - edge;

  return edge;
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
  float mouseInfluence = smoothstep(0.01, 1.7, uMouseVelocity);
  float clampedMouseInfluence = clamp(mouseInfluence, 0.1, 1.0);

  float mouseWave = 0.0;
  float mouseRadius = mix(0.01, 0.08, clampedMouseInfluence);
  float invertedRadius = 1.0 / mouseRadius;

  float mouseDist = distance(mousePos, vUv);
  mouseDist /= mouseRadius;
  mouseDist = clamp(mouseDist, 0.0, 1.0);
  mouseDist = 1.0 - mouseDist;

  float stepMouse = smoothstep(0.0, 0.6, mouseDist);

  float dirMouseDist = dot(mouseDir, vUv - mousePos) * invertedRadius * PI;
  dirMouseDist = clamp(dirMouseDist, -PI, PI);
  dirMouseDist = sin(dirMouseDist);

  mouseWave = dirMouseDist * stepMouse;

  float mouseMixer = clamp(uMouseVelocity * 2.0, 0.0, 1.0);
  mouseMixer *= mix(stepMouse, mouseDist, 0.5);

  return Mouse(mouseWave, dirMouseDist, mouseDist, stepMouse, mouseMixer);
}

float sdEquilateralTriangle(vec2 p, float r) {
  const float k = sqrt(3.0);
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
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

  // Wave propagation
  d += -(p11 - 0.5) * 2.0 + (p10 + p01 + p21 + p12 - 2.0);

  // Add mouse
  Mouse mouse = getMouseWave();

  if (mouse.wave > 0.0) {
    // weight in the distance to the floor// d += mouse.wave * 0.05 * smoothstep(0.05, 0.0, abs(d)) * mouse.mixer;
  }
  else {
    d += mouse.wave * 0.03 * mouse.mixer;
  }

  // damping
  d *= 0.99;

  #ifdef EDGE_DAMPING
  // edge damping
  float edge = getEdgeFactor();
  d = mix(d, 0.0, edge);
  #endif

  // avoid too much noise
  d = max(d, -0.5);

  // remap from -1-1 to 0-1
  d = d * 0.5 + 0.5;

  float tri = sdEquilateralTriangle(vUv - vec2(0.5), 0.1);

  if (tri < 0.0) {
    d = 0.6;
  }

  // Put previous state as "y":
  gl_FragColor = vec4(d, c.x, 0.0, 1.0);

  // gl_FragColor = vec4(mouse.wave * mouse.mixer, 0.0, 0.0, 1.0);

}
