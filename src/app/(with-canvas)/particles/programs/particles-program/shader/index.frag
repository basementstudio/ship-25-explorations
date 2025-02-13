#version 300 es

precision highp float;

out vec4 fragColor;

void main() {
  vec2 uv = gl_PointCoord.xy;

  // float circle = smoothstep(0.5, 0.4, length(uv - 0.5)) * 0.8;

  float circleDistance = 1.0 - distance(uv, vec2(0.5)) * 2.0;
  circleDistance = clamp(circleDistance, 0.0, 1.0);

  fragColor.rgb = vec3(circleDistance);
  fragColor.a = 1.0;
}
