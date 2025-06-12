struct RayResult {
  bool hit;
  vec3 position;
  float distance;
};

struct RaymarchResult {
  vec4 color;
  float depth;
};

#pragma glslify: export(RayResult)
#pragma glslify: export(RaymarchResult)
