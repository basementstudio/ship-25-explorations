#pragma glslify: getSceneHit = require('./get-scene-hit.glsl', time = time)
#pragma glslify: getEnvColor = require('../../glsl-shared/get-env-color.glsl', texture = texture)

uniform sampler2D uEnvMap;

// Normal calculation function (using gradient):
const vec3 GRADIENT_STEP = vec3(0.001, 0.0, 0.0);
vec3 getNormal(vec3 p) {
  float gradientX =
    getSceneHit(p + GRADIENT_STEP.xyy) - getSceneHit(p - GRADIENT_STEP.xyy);
  float gradientY =
    getSceneHit(p + GRADIENT_STEP.yxy) - getSceneHit(p - GRADIENT_STEP.yxy);
  float gradientZ =
    getSceneHit(p + GRADIENT_STEP.yyx) - getSceneHit(p - GRADIENT_STEP.yyx);
  return normalize(vec3(gradientX, gradientY, gradientZ));
}

vec3 mainColor = vec3(0.1);

vec3 getSurface(vec3 p, vec3 rayDirection) {
  vec3 viewDir = -rayDirection;
  vec3 normal = getNormal(p);

  vec3 reflectedNormal = reflect(viewDir, normal);

  vec3 light = getEnvColor(uEnvMap, reflectedNormal);

  return light;
}

#pragma glslify: export(getSurface)
