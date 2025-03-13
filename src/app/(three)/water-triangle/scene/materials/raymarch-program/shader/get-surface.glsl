#pragma glslify: getSceneHit = require('./get-scene-hit.glsl', time = time, texture = texture, textureSize = textureSize)

uniform samplerCube envMap;
uniform mat3 envMapRotation;

const float GRADIENT_BIAS = 0.01;

// Normal calculation function (using gradient):
const vec3 GRADIENT_STEP = vec3(GRADIENT_BIAS, 0.0, 0.0);
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
  return vec3(lambert);
}

vec3 getEnv3(vec3 normal) {
  vec4 envColor = texture(envMap, envMapRotation * normal);

  return envColor.rgb;
}

vec3 getSurface(vec3 p, vec3 rayDirection) {
  vec3 viewDir = rayDirection;
  vec3 normal = getNormal(p);

  vec3 reflectedNormal = reflect(viewDir, normal);


  vec3 env = getEnv3(reflectedNormal);

  // vec3 light = getLight(p, normal);

  // return reflectedNormal;

  return env;
}

#pragma glslify: export(getSurface)
