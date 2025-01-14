vec3 Translate(vec3 p, vec3 t) {
  return p - t;
}

#pragma glslify: export(Translate)
