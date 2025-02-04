float valueRemap(
  float value,
  float min,
  float max,
  float newMin,
  float newMax
) {
  return newMin + (value - min) * (newMax - newMin) / (max - min);
}

#pragma glslify: export(valueRemap)
