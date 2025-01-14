struct Material {
  vec3 color;
  float glossiness;
  float reflectivity;
};

struct RayHit {
  float dist;
  Material material;
};

struct CastedRay {
  bool hit;
  vec3 position;
};

struct RayLightResult {
  vec3 color;
  float reflectFactor;
};

struct SurfaceResult {
  vec3 color;
  vec3 normal;
  float reflectFactor;
};

#pragma glslify: export(Material)
#pragma glslify: export(RayHit)
#pragma glslify: export(CastedRay)
#pragma glslify: export(RayLightResult)
#pragma glslify: export(SurfaceResult)
