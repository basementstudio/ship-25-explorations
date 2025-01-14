float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
  vec3 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}

float sdPlane(vec3 p, vec4 n) {
  return dot(p, normalize(n.xyz)) + n.w;
}

#pragma glslify: export(sdSphere)
#pragma glslify: export(sdBox)
#pragma glslify: export(sdPlane)
