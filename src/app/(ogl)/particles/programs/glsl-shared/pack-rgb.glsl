vec3 packRGB(float v) {
  vec3 pack = fract(vec3(1.0, 255.0, 65025.0) * v);
  pack -= pack.yzx * vec3(1.0 / 255.0, 1.0 / 255.0, 0.0);
  return pack;
}

#pragma glslify: export(packRGB)
