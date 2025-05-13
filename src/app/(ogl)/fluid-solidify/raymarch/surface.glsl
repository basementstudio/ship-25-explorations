uniform vec3 mainColor;
uniform sampler2D matcapMap;
uniform sampler2D reflectionMap;
uniform float reflectionIntensity;
uniform vec3 lightDirection;

#pragma glslify: cnoise3d = require('glsl-noise/classic/3d')

#define PI (3.14159265359)

#pragma glslify: getVogel = require('./math.glsl')

vec2 normalToReflectionUv(vec3 n) {
  float u = atan(n.x, n.z) / (2.0 * PI) + 0.5;
  float v = n.y * 0.5 + 0.5;
  return vec2(u, v);
}

vec3 getReflection(vec3 normal) {
  vec2 uv = normalToReflectionUv(normal);
  uv.y = 1.0 - uv.y;
  vec3 reflection = texture2D(reflectionMap, uv).rgb;
  return reflection;
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

// Quaternion multiplication
vec4 qmul(vec4 q1, vec4 q2) {
  return vec4(
    q1.w * q2.xyz + q2.w * q1.xyz + cross(q1.xyz, q2.xyz),
    q1.w * q2.w - dot(q1.xyz, q2.xyz)
  );
}

// Rotate vector by quaternion
vec3 rotateVector(vec3 v, vec4 q) {
  vec4 qv = qmul(q, vec4(v, 0.0));
  vec4 qinv = vec4(-q.xyz, q.w);
  return qmul(qv, qinv).xyz;
}

// Get rotation quaternion from two vectors
vec4 getRotationBetweenVectors(vec3 from, vec3 to) {
  vec3 axis = cross(from, to);
  float cosAngle = dot(from, to);
  float k = sqrt(dot(from, from) * dot(to, to));

  if (cosAngle / k == -1.0) {
    // 180 degree rotation around any perpendicular axis
    vec3 perpendicular = normalize(
      abs(from.x) < 0.9
        ? cross(from, vec3(1.0, 0.0, 0.0))
        : cross(from, vec3(0.0, 1.0, 0.0))
    );
    return vec4(perpendicular, 0.0);
  }

  return normalize(vec4(axis, k + cosAngle));
}

vec3 rotateRay(vec3 rd, vec2 uv) {
  // Convert uv to a 3D direction vector
  vec3 uvDirection = normalize(vec3(uv, 1.0));

  // Get the rotation quaternion from up vector to UV direction
  vec4 rotation = getRotationBetweenVectors(vec3(0.0, 0.0, 1.0), uvDirection);

  // Apply the rotation to the ray direction
  return rotateVector(rd, rotation);
}

const int totalSamples = 40;
const float diskSize = 0.06;

vec3 rand(vec2 uv) {
  return vec3(
    fract(sin(dot(uv, vec2(12.75613, 38.12123))) * 13234.76575),
    fract(sin(dot(uv, vec2(19.45531, 58.46547))) * 43678.23431),
    fract(sin(dot(uv, vec2(23.67817, 78.23121))) * 93567.23423)
  );
}

SurfaceResult getSurfaceLight(vec3 p, vec3 rd) {
  vec3 viewDirection = -rd;
  vec3 materialColor = mainColor;
  vec3 normal = getNormal(p);

  float rotation = rand(p.xy).x;

  float lambert = max(0.0, dot(lightDirection, normal));

  vec3 reflectionDirection = reflect(rd, normal);

  vec3 reflection = vec3(0.0);

  for (int i = 0; i < totalSamples; i++) {
    vec2 uv = getVogel(diskSize, float(i), float(totalSamples), rotation);
    reflection += getReflection(rotateRay(reflectionDirection, uv));
  }

  reflection /= float(totalSamples);
  reflection *= 5.0;

  vec3 light = reflection * materialColor;

  return SurfaceResult(vec3(light), normal, 0.0);
}

#pragma glslify: export(getSurfaceLight)
