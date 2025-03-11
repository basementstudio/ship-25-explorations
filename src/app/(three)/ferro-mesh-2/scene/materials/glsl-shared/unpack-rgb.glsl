float unpackRGB(vec3 pack) {
  return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));
}

#pragma glslify: export(unpackRGB)
