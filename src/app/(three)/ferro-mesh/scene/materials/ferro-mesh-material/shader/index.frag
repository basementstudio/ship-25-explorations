precision highp float;

uniform vec3 uWorldPosition;
uniform vec3 cameraPosition;

out vec4 fragColor;

in vec3 pOrigin;
in vec3 worldPosition;

in vec3 vNormal;

#pragma glslify: displacement = require('./displacement.glsl', texture = texture, textureSize = textureSize, textureLod = textureLod, MAX_PARTICLES = MAX_PARTICLES)

#pragma glslify: getLights = require('./lights.glsl', texture = texture, textureSize = textureSize, worldPosition = worldPosition, textureLod = textureLod)

vec3 calculateNormal(vec3 pOrigin) {
  // Define a small step size
  float epsilon = 0.01;

  // Sample the displacement at slightly offset positions
  vec3 offsetX = vec3(epsilon, 0.0, 0.0);
  vec3 offsetZ = vec3(0.0, 0.0, epsilon);

  float heightCenter = displacement(pOrigin).y;
  float heightX = displacement(pOrigin + offsetX).y;
  float heightZ = displacement(pOrigin + offsetZ).y;

  // Calculate the normal using finite differences
  vec3 normal = normalize(
    vec3(heightX - heightCenter, epsilon, heightZ - heightCenter)
  );

  return normal;
}

void main() {
  vec3 normal = calculateNormal(pOrigin);

  vec4 color = getLights(normal, cameraPosition, worldPosition);

  // Output the color
  fragColor = color;
}
