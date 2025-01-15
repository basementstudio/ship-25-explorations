vec3 Translate(vec3 p, vec3 t) {
  return p - t;
}

// Expensive, do not use
vec3 Rotate(vec3 p, vec3 r) {
  // Rotation around X axis
  mat3 rotX = mat3(
    1.0,
    0.0,
    0.0,
    0.0,
    cos(r.x),
    -sin(r.x),
    0.0,
    sin(r.x),
    cos(r.x)
  );

  // Rotation around Y axis
  mat3 rotY = mat3(
    cos(r.y),
    0.0,
    sin(r.y),
    0.0,
    1.0,
    0.0,
    -sin(r.y),
    0.0,
    cos(r.y)
  );

  // Rotation around Z axis
  mat3 rotZ = mat3(
    cos(r.z),
    -sin(r.z),
    0.0,
    sin(r.z),
    cos(r.z),
    0.0,
    0.0,
    0.0,
    1.0
  );

  // Apply all rotations in order (Z * Y * X)
  return p * rotX * rotY * rotZ;
}

#pragma glslify: export(Translate)
#pragma glslify: export(Rotate)
