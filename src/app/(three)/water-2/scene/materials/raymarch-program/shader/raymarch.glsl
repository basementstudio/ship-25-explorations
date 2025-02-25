#pragma glslify: getSurface = require('./get-surface.glsl', time=time, texture = texture, textureSize = textureSize)
#pragma glslify: structsModule = require('./structs.glsl', RayResult=RayResult)
#pragma glslify: getSceneHit = require('./get-scene-hit.glsl', time=time, texture = texture, textureSize = textureSize)

const float SURFACE_DIST = 0.001;
const int MAX_STEPS = 200;

RayResult castRay(
  vec3 ro,
  vec3 rd,
  float maxDistance,
  float surfaceDistance,
  int maxSteps
) {
  // depth
  float d0 = 0.0;
  float hitPoint = getSceneHit(ro);
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + d0 * rd;
    hitPoint = getSceneHit(p);
    d0 += hitPoint;
    if (hitPoint < surfaceDistance || d0 >= maxDistance) {
      break;
    }
    ;
  }
  bool isHit = hitPoint < surfaceDistance;
  vec3 p = ro + d0 * rd;
  return RayResult(isHit, p, d0);
}

RaymarchResult rayMarch(vec3 rayPosition, vec3 rayDirection, float maxDepth) {
  vec4 result = vec4(1.0, 1.0, 1.0, 0.0);

  float distance = 0.0;

  RayResult hit = castRay(
    rayPosition,
    rayDirection,
    maxDepth,
    SURFACE_DIST,
    MAX_STEPS
  );

  if (hit.hit) {
    vec3 color = getSurface(hit.position, rayDirection);
    color = hit.distance < 0.01 ? vec3(1.0) : color;
    result = vec4(color, 1.0);
    distance = hit.distance;
  } else {
    distance = 1.0;
  }

  return RaymarchResult(result, distance);
}

#pragma glslify: export(rayMarch)
