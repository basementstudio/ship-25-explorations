vec3 rotateVector2(vec3 vector, vec2 rotation) {
  float xRotation = rotation.x;
  float yRotation = rotation.y;

  vec3 rotatedVector = vec3(
    vector.x * cos(yRotation) - vector.z * sin(yRotation),
    vector.y,
    vector.x * sin(yRotation) + vector.z * cos(yRotation)
  );

  rotatedVector = vec3(
    rotatedVector.x * cos(xRotation) - rotatedVector.y * sin(xRotation),
    rotatedVector.x * sin(xRotation) + rotatedVector.y * cos(xRotation),
    rotatedVector.z
  );

  return rotatedVector;
}

#pragma glslify: export(rotateVector2)
