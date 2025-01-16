struct RayResult {
  bool hit;
  vec3 position;
  float distance;
};

#pragma glslify: export(RayResult)
