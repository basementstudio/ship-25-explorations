precision highp float;

in vec3 position;

uniform float uTime;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

out vec3 worldPosition;
out vec3 pOrigin;
out vec3 vNormal;
float gain(float x, float k) {
  return pow(x, k) / (pow(x, k) + pow(1.0 - x, k));
}

vec3 gain(vec3 x, float k) {
  return vec3(gain(x.r, k), gain(x.g, k), gain(x.b, k));
}

float tone(float x, float k) {
  return (k + 1.0) / (1.0 + k * x);
}

vec2 squareToCircle(vec2 p) {
  // Calculate the length of the vector
  float lengthSquared = dot(p, p);

  // Remap the square to a circle
  if (lengthSquared > 1.0) {
    p = normalize(p);
  } else {
    p *= sqrt(1.0 - lengthSquared);
    float factor = pow(lengthSquared * 2.0, 2.0); // Adjust the exponent to control concentration
    p *= factor;
  }

  return p;
}

vec3 initialRemap(vec3 p) {
  p = gain(p, 0.4);
  p.xy -= vec2(0.5);
  p *= 2.0;
  return p;
}

#pragma glslify: displacement = require('./displacement.glsl', texture = texture, textureSize = textureSize, textureLod = textureLod)

vec3 calculateNormal(vec3 displaced, vec3 pOrigin) {
  // Define a small step size
  float epsilon = 0.0001;

  // Sample the displacement at slightly offset positions
  vec3 offsetX = vec3(epsilon, 0.0, 0.0);
  vec3 offsetZ = vec3(0.0, 0.0, epsilon);

  float heightCenter = displaced.y;
  float heightX = displacement(pOrigin + offsetX).y;
  float heightZ = displacement(pOrigin + offsetZ).y;

  // Calculate the normal using finite differences
  vec3 normal = normalize(
    vec3(heightX - heightCenter, epsilon, heightZ - heightCenter)
  );

  return normal;
}

void main() {
  vec3 p = position;
  p = initialRemap(p);

  vec4 modelPosition = modelMatrix * vec4(p, 1.0);

  pOrigin = modelPosition.xyz;

  // apply displacement
  modelPosition.xyz = displacement(modelPosition.xyz);

  vNormal = calculateNormal(modelPosition.xyz, pOrigin);

  worldPosition = modelPosition.xyz;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectionPosition = projectionMatrix * viewPosition;
  gl_Position = projectionPosition;
}
