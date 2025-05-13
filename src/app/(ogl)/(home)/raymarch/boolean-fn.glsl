RayHit Union(RayHit hit1, RayHit hit2) {
  if (hit1.dist < hit2.dist) {
    return hit1;
  } else {
    return hit2;
  }
}

RayHit Intersection(RayHit hit1, RayHit hit2) {
  if (hit1.dist > hit2.dist) {
    return hit1;
  } else {
    return hit2;
  }
}

RayHit Difference(RayHit hit1, RayHit hit2) {
  return Intersection(hit1, RayHit(-hit2.dist, hit2.material));
}

float opSmoothUnion(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) - k * h * (1.0 - h);
}

RayHit SmoothMin(RayHit hit1, RayHit hit2, float k) {
  // distance mix
  float d1 = hit1.dist;
  float d2 = hit2.dist;
  float h = max(k - abs(d1 - d2), 0.0) / k;
  float d = min(d1, d2) - h * h * h * k * 1.0 / 6.0;

  // color mix
  float d3 = d1 + d2;
  float cMix = d1 / d3;
  vec3 mixedColor = mix(hit1.material.color, hit2.material.color, cMix);
  float mixedGlossiness = mix(
    hit1.material.glossiness,
    hit2.material.glossiness,
    cMix
  );
  float mixedReflectivity = mix(
    hit1.material.reflectivity,
    hit2.material.reflectivity,
    cMix
  );
  Material mat = Material(mixedColor, mixedGlossiness, mixedReflectivity);
  return RayHit(d, mat);
}

#pragma glslify: export(opSmoothUnion)
#pragma glslify: export(Union)
#pragma glslify: export(Intersection)
#pragma glslify: export(Difference)
#pragma glslify: export(SmoothMin)
