precision highp float;

uniform float uTime;
uniform vec3 uWorldPosition;

out vec4 fragColor;

in vec3 pOrigin;
in vec3 worldPosition;

in vec3 vNormal;

#pragma glslify: displacement = require('./displacement.glsl')

void main() {
  // Use the normal for shading (e.g., simple diffuse shading)
  float diffuse = max(dot(normalize(vNormal), vec3(0.0, 1.0, 0.0)), 0.0);

  // Output the color
  fragColor = vec4(vec3(diffuse), 1.0);
}
