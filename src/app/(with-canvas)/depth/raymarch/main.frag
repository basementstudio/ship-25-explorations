precision highp float;

#pragma glslify: cnoise = require('glsl-noise/classic/2d')
#pragma glslify: cnoise3d = require('glsl-noise/classic/3d')

#define MAX_STEPS (300)
#define SURFACE_DIST (0.00001)
#define MAX_DISTANCE (30.0)

uniform vec3 cPos;
uniform vec4 cameraQuaternion;
uniform float fov;
uniform float uTime;
uniform vec2 resolution;
uniform vec2 mousePos;
uniform mat3 floorRotation;
uniform vec3 projectedMousePos;
uniform float speed;
uniform vec3 mainColor;
uniform sampler2D matcapMap;
uniform sampler2D reflectionMap;
uniform float reflectionIntensity;
uniform vec3 lightDirection;
uniform float lightIntensity;
uniform float glossiness;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vPosition;

#pragma glslify: structsModule = require('./structs.glsl', Material=Material, RayHit=RayHit, CastedRay=CastedRay, RayLightResult=RayLightResult, SurfaceResult=SurfaceResult)
#pragma glslify: booleanModule = require('./boolean-fn.glsl', opSmoothUnion=opSmoothUnion, RayHit=RayHit, Material=Material)
#pragma glslify: transformsModule = require('./transforms.glsl', Translate=Translate, Rotate=Rotate, opScale=opScale)
#pragma glslify: sdfModule = require('./distance-fn.glsl', sdSphere=sdSphere, sdBox=sdBox, sdPlane=sdPlane, sdRoundBox=sdRoundBox, sdPyramid=sdPyramid)

float random(vec2 p) {
  return fract(sin(dot(p.xy, vec2(12.345, 67.89))) * 43758.5453123);
}

float getNoiseLevel(vec3 p) {
  float centerLength = 1.0;

  vec3 centerP = Translate(p, projectedMousePos);
  float center = (centerLength - length(centerP)) / centerLength;
  center = clamp(center, 0.0, 1.0);
  center = smoothstep(0.0, 1.0, center);

  float sinNoise = sin((center + uTime * 0.1) * 20.0) * 0.1 * center;

  // polar noise arriund center
  float polarNoise = cos(atan(centerP.x, centerP.z) * 50.0 + uTime * 10.0);

  float n2 = sin(p.x * 20.0) + sin(p.z * 20.0);

  float bigNoise = cnoise3d(vec3(p.xz * 2.3, uTime * 0.2));

  float n = 0.0;
  n = bigNoise * n2 * sinNoise + sinNoise * 0.3;
  n *= speed;
  return n;
}

float getSceneHit(vec3 p) {
  vec3 floorP = p;
  floorP = Translate(
    floorP,
    vec3(0.0, getNoiseLevel(vec3(p.x, 0.0, p.z)), 0.0)
  );

  float floorPlane = sdPlane(floorP, vec4(0.0, 1.0, 0.0, 0.0));

  vec3 cubeCenter = projectedMousePos;
  cubeCenter.y += 0.1;
  float cube = sdSphere(Translate(p, cubeCenter), 0.1);

  return floorPlane;
}

#pragma glslify: surfaceModule = require('./surface.glsl', getSurfaceLight=getSurfaceLight, getSceneHit=getSceneHit, SurfaceResult=SurfaceResult, RayHit=RayHit, Material=Material, mainColor=mainColor, matcapMap=matcapMap, reflectionMap=reflectionMap, reflectionIntensity=reflectionIntensity, lightDirection=lightDirection, glossiness=glossiness, lightIntensity=lightIntensity)

CastedRay castRay(vec3 ro, vec3 rd, float maxDistance, float surfaceDistance) {
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
  return CastedRay(isHit, p);
}

vec2 normalToUv(vec3 normal) {
  return normal.xy;
}

// returns a color for the given ray
vec3 rayMarch(vec3 ro, vec3 rd) {
  vec3 rayPosition = ro;
  vec3 rayDirection = rd;
  vec3 result = vec3(0.0);

  CastedRay hit = castRay(
    rayPosition,
    rayDirection,
    MAX_DISTANCE,
    SURFACE_DIST
  );

  RayLightResult lightResult;

  if (hit.hit) {
    SurfaceResult objectLight = getSurfaceLight(hit.position, rayDirection, ro);
    lightResult = RayLightResult(objectLight.color, objectLight.reflectFactor);

  } else {
    lightResult = RayLightResult(vec3(0.0), 0.0);
  }

  return lightResult.color;
}

// camera utils

// https://www.geeks3d.com/20141201/how-to-rotate-a-vertex-by-a-quaternion-in-glsl/
vec4 quat_from_axis_angle(vec3 axis, float angle) {
  vec4 qr;
  float half_angle = angle * 0.5 * 3.14159 / 180.0;
  qr.x = axis.x * sin(half_angle);
  qr.y = axis.y * sin(half_angle);
  qr.z = axis.z * sin(half_angle);
  qr.w = cos(half_angle);
  return qr;
}

vec3 rotate_vertex_position(vec3 position, vec3 axis, float angle) {
  vec4 q = quat_from_axis_angle(axis, angle);
  vec3 v = position.xyz;
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

vec3 quaterion_rotate(vec3 v, vec4 q) {
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

void main() {
  float aspectRatio = resolution.x / resolution.y;
  vec3 cameraOrigin = cPos;

  float fovMult = fov / 90.0;

  vec2 screenPos = (gl_FragCoord.xy * 2.0 - resolution) / resolution;
  screenPos.x *= aspectRatio;
  screenPos *= fovMult;
  vec3 ray = vec3(screenPos.xy, -1.0);
  ray = quaterion_rotate(ray, cameraQuaternion);
  ray = normalize(ray);

  vec3 color = rayMarch(cameraOrigin, ray);

  gl_FragColor = vec4(color, 1.0);
}
