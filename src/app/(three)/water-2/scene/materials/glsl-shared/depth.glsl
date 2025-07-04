float linearizeDepth(float depth, float near, float far) {
  float z = depth * 2.0 - 1.0; // back to NDC
  return 2.0 * near * far / (far + near - z * (far - near));
}

float viewSpaceDepth(float depth, float near, float far) {
  float z = depth * (far - near) - far;
  return (far + near + z) / (2.0 * far);
}

#pragma glslify: export(linearizeDepth)
#pragma glslify: export(viewSpaceDepth)
