#pragma glslify: cnoise3d = require('glsl-noise/classic/3d')

#define PI (3.14159265359)

#pragma glslify: getVogel = require('./math.glsl')

const float ior = 1.01;

vec2 normalToReflectionUv(vec3 n) {
  float u = atan(n.x, n.z) / (2.0 * PI) + 0.5;
  // Remap u to go from 0 to 1 to 0
  u = 1.0 - abs(2.0 * u - 1.0);

  float v = n.y * 0.5 + 0.5;
  return vec2(u, v);
}

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

const int totalSamples = 20;
const float diskSize = 0.01;

float rand3(vec3 p) {
  return fract(sin(dot(p, vec3(12.75613, 38.12123, 78.23121))) * 13234.76575);
}

float getGaussian(float x, float sigma) {
  return exp(-x * x / (2.0 * sigma * sigma));
}

vec3 getReflection(vec3 normal, float randomRotation) {
  vec2 uv = normalToReflectionUv(normal);
  vec3 reflection = vec3(0.0);

  reflection = vec3(0.0);

  for (int i = 0; i < totalSamples; i++) {
    vec2 distUv = getVogel(
      diskSize,
      float(i),
      float(totalSamples),
      randomRotation
    );
    float gaussian = getGaussian(float(i) / float(totalSamples), 0.1);
    reflection += texture2D(reflectionMap, uv + distUv).rgb * gaussian;
  }

  reflection /= float(totalSamples);
  reflection *= 6.0;

  return reflection;
}

SurfaceResult getSurfaceLight(vec3 p, vec3 rd, vec3 ro) {
  vec3 viewDirection = -rd;
  vec3 materialColor = mainColor;
  vec3 normal = getNormal(p);

  float lambert = max(0.0, dot(lightDirection, normal));
  vec3 vLambertLight = mainColor * lambert;

  float fresnel = pow(1.0 - dot(normal, viewDirection), 5.0);

  float specularExponent = pow(2.0, glossiness * 10.0) + 20.0;
  vec3 halfVector = normalize(lightDirection + viewDirection);
  float specular = max(dot(halfVector, normal), 0.0);
  specular = pow(specular, specularExponent);
  specular = specular * smoothstep(0.0, 1.0, lambert * 2.0);
  specular = specular * glossiness * 0.001;

  float specular2 = dot(normal, lightDirection);
  specular2 = pow(specular2, specularExponent);
  specular2 = specular2 * smoothstep(0.0, 1.0, lambert * 2.0);
  specular2 = specular2 * glossiness;
  specular2 *= lightIntensity;

  specular += specular2;

  vec3 vSpecularLight = vec3(1.0) * specular * lightIntensity;
  // combining the two lights
  vec3 light = vLambertLight + vSpecularLight;

  vec3 reflectionDirection = reflect(rd, normal);

  float rotation = rand3(p * 100.0);
  vec3 reflection =
    getReflection(reflectionDirection, rotation) * reflectionIntensity;
  light += reflection * fresnel;

  // vec3 light = lambert * materialColor;

  return SurfaceResult(vec3(light), normal, 0.0);
}

#pragma glslify: export(getSurfaceLight)
