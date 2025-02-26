precision highp float;

in vec3 position;

uniform float uTime;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

float gain(float x, float k) {
  return pow(x, k) / (pow(x, k) + pow(1.0 - x, k));
}

vec3 gain(vec3 x, float k) {
  return vec3(gain(x.r, k), gain(x.g, k), gain(x.b, k));
}

float tone(float x, float k) {
  return (k + 1.0) / (1.0 + k * x);
}

vec3 initialRemap(vec3 p) {
  float l = length(p);
  if (l < 0.0001 || l > 0.99999) {
    return p;
  }
  float newL = pow(l, 3.0);
  return normalize(p) * newL;
}

#pragma glslify: displacement = require('./displacement.glsl')

void main() {
  vec3 p = position;
  p = initialRemap(p);

  vec4 modelPosition = modelMatrix * vec4(p, 1.0);

  modelPosition.xyz = displacement(modelPosition.xyz);

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectionPosition = projectionMatrix * viewPosition;
  gl_Position = projectionPosition;
}
