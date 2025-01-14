uniform vec3 mainColor;
uniform sampler2D matcapMap;
uniform sampler2D reflectionMap;
uniform float reflectionIntensity;
uniform vec3 lightDirection;

#define PI (3.14159265359)

vec2 normalToReflectionUv(vec3 n) {
  float u = atan(n.x, n.z) / (2.0 * PI) + 0.5;
  float v = n.y * 0.5 + 0.5;
  return vec2(u, v);
}

vec3 getReflection(vec3 normal) {
  vec2 uv = normalToReflectionUv(normal);
  vec3 reflection = texture2D(reflectionMap, uv).rgb;
  return reflection * 10.0;
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

SurfaceResult getSurfaceLight(vec3 p, vec3 rd) {
  vec3 viewDirection = -rd;
  vec3 materialColor = mainColor;
  vec3 normal = getNormal(p);

  float lambert = max(0.0, dot(lightDirection, normal));
  vec3 reflection = getReflection(reflect(rd, normal));

  reflection = mix(vec3(1.0), reflection, reflectionIntensity);

  vec3 light = reflection * materialColor;

  return SurfaceResult(light, normal, 0.0);
}

#pragma glslify: export(getSurfaceLight)
