#pragma glslify: getSceneHit = require('./get-scene-hit.glsl', time = time, texture = texture, textureSize = textureSize)
#pragma glslify: getEnvColor = require('../../glsl-shared/get-env-color.glsl', texture = texture, textureSize = textureSize)

uniform sampler2D uEnvMap;

// Normal calculation function (using gradient):
const vec3 GRADIENT_STEP = vec3(0.02, 0.0, 0.0);
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

vec3 lightDirection = normalize(vec3(0.0, 1.0, 1.0));

vec3 getLight(vec3 p, vec3 reflectedNormal) {
  float lambert = dot(reflectedNormal, lightDirection);
  lambert = clamp(lambert, 0.0, 1.0) * 0.9;

  // float pl = clamp(1.7 + p.z, 0.0, 1.0);
  // lambert *= pl;

  return vec3(lambert);
}

vec3 getSurface(vec3 p, vec3 rayDirection) {
  vec3 viewDir = -rayDirection;
  vec3 normal = getNormal(p);

  vec3 reflectedNormal = reflect(viewDir, normal);

  vec3 light = getEnvColor(uEnvMap, reflectedNormal, viewDir);

  // vec3 light = getLight(p, normal);

  // return reflectedNormal;

  return light;
}

#pragma glslify: export(getSurface)
