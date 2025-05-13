float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
  vec3 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}

float sdRoundBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

float sdPlane(vec3 p, vec4 n) {
  return dot(p, normalize(n.xyz)) + n.w;
}

float sdPyramid(vec3 p, float h) {
  float m2 = h * h + 0.25;

  p.xz = abs(p.xz);
  p.xz = p.z > p.x ? p.zx : p.xz;
  p.xz -= 0.5;

  vec3 q = vec3(p.z, h * p.y - 0.5 * p.x, h * p.x + 0.5 * p.y);

  float s = max(-q.x, 0.0);
  float t = clamp((q.y - 0.5 * p.z) / (m2 + 0.25), 0.0, 1.0);

  float a = m2 * (q.x + s) * (q.x + s) + q.y * q.y;
  float b =
    m2 * (q.x + 0.5 * t) * (q.x + 0.5 * t) + (q.y - m2 * t) * (q.y - m2 * t);

  float d2 = min(q.y, -q.x * m2 - q.y * 0.5) > 0.0 ? 0.0 : min(a, b);

  return sqrt((d2 + q.z * q.z) / m2) * sign(max(q.z, -p.y));
}

#pragma glslify: export(sdSphere)
#pragma glslify: export(sdBox)
#pragma glslify: export(sdRoundBox)
#pragma glslify: export(sdPlane)
#pragma glslify: export(sdPyramid)
