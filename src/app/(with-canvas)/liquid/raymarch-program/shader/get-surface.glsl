#pragma glslify: getSceneHit = require('./get-scene-hit.glsl', time = time)

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

vec3 lightDirection = normalize(vec3(1.3, 4.5, 1.1));
vec3 mainColor = vec3(0.1);
float glossiness = 2.0;
float lightIntensity = 1.0;

vec3 getSurface(vec3 p, vec3 rayDirection) {
  vec3 viewDir = -rayDirection;
  vec3 normal = getNormal(p);

  float lambert = max(0.0, dot(lightDirection, normal));

  vec3 vLambertLight = mainColor * lambert;

  float specularExponent = pow(2.0, glossiness * 3.0) + 10.0;
  vec3 halfVector = normalize(lightDirection + viewDir);
  float specular = max(dot(halfVector, normal), 0.0);
  specular = pow(specular, specularExponent);
  specular = specular * smoothstep(0.0, 1.0, lambert * 2.0);
  specular = specular * glossiness;
  vec3 vSpecularLight = vec3(1.0) * specular * lightIntensity;

  vec3 light = vLambertLight + vSpecularLight;

  return light;
}

#pragma glslify: export(getSurface)
