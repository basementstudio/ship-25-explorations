float valueRemap(
  float value,
  float min,
  float max,
  float newMin,
  float newMax
) {
  return newMin + (value - min) / (max - min) * (newMax - newMin);
}

#pragma glslify: export(valueRemap)
