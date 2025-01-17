#pragma glslify: getSurface = require('./get-surface.glsl', time=time, viewDirection=viewDirection)
#pragma glslify: structsModule = require('./structs.glsl', RayResult=RayResult)
#pragma glslify: getSceneHit = require('./get-scene-hit.glsl', time=time)

const float MAX_DISTANCE = 2.0;
const float SURFACE_DIST = 0.001;
const int MAX_STEPS = 100;

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
    if (hitPoint < surfaceDistance || d0 > maxDistance) {
      break;
    }
    ;
  }
  bool isHit = hitPoint < surfaceDistance;
  vec3 p = ro + d0 * rd;
  return RayResult(isHit, p, d0);
}

RaymarchResult rayMarch() {
  vec3 rayPosition = wPos;
  vec3 rayDirection = normalize(viewDirection);
  vec4 result = vec4(1.0, 1.0, 1.0, 0.0);

  float distance = 0.0;

  RayResult hit = castRay(
    rayPosition,
    rayDirection,
    MAX_DISTANCE,
    SURFACE_DIST,
    MAX_STEPS
  );

  if (hit.hit) {
    vec3 color = getSurface(hit.position, rayDirection);
    result = vec4(color, 1.0);
    distance = hit.distance;
  } else {
    distance = 0.999;
  }

  return RaymarchResult(result, distance);
}

#pragma glslify: export(rayMarch)
