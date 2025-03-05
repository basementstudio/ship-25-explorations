precision highp float;

uniform vec3 uWorldPosition;
uniform vec3 cameraPosition;

out vec4 fragColor;

in vec3 pOrigin;
in vec3 worldPosition;

in vec3 vNormal;

#pragma glslify: displacement = require('./displacement.glsl', texture = texture, textureSize = textureSize, textureLod = textureLod, MAX_PARTICLES = MAX_PARTICLES)

#pragma glslify: getLights = require('./lights.glsl', texture = texture, textureSize = textureSize, worldPosition = worldPosition, textureLod = textureLod)

vec3 calculateNormal(vec3 pOrigin, vec3 worldPos) {
  // Define a small step size
  float epsilon = 0.005;

  // Sample the displacement at slightly offset positions
  vec3 offsetX = vec3(epsilon, 0.0, 0.0);
  vec3 offsetY = vec3(0.0, epsilon, 0.0);
  vec3 offsetZ = vec3(0.0, 0.0, epsilon);

  // Get full displacement vectors

  vec3 displacedX = displacement(pOrigin + offsetX);
  vec3 displacedZ = displacement(pOrigin + offsetZ);

  // Calculate tangent vectors
  vec3 tangentX = displacedX - worldPos;
  vec3 tangentZ = displacedZ - worldPos;

  // Cross product of tangent vectors gives the normal
  return -normalize(cross(tangentX, tangentZ));
}

void main() {
  vec3 worldPos = displacement(pOrigin);
  vec3 normal = calculateNormal(pOrigin, worldPos);

  vec4 color = getLights(normal, cameraPosition, worldPos);

  // Output the color
  fragColor = color;
}
