#pragma glslify: getVogel = require('./get-vogel.glsl')

const int totalSamples = 128;

float getGaussian(float x, float sigma) {
  return exp(-x * x / (2.0 * sigma * sigma));
}

float rand3(vec3 p) {
  return fract(sin(dot(p, vec3(12.75613, 38.12123, 78.23121))) * 13234.76575);
}

vec4 glassColor(vec2 uv, float blurSize) {
  vec3 reflection = vec3(0.0);
  float alpha = 0.0;

  float randomRotation = rand3(vec3(uv, 0.0));

  for (int i = 0; i < totalSamples; i++) {
    vec2 distUv = getVogel(
      blurSize,
      float(i),
      float(totalSamples),
      randomRotation
    );
    float gaussian = getGaussian(float(i) / float(totalSamples), 0.9);
    vec4 sample = texture2D(reflectionMap, uv + distUv);
    reflection += sample.rgb * gaussian;
    alpha += sample.a;
  }

  reflection /= float(totalSamples);
  alpha = clamp(alpha / float(totalSamples), 0.0, 1.0);
  alpha = pow(alpha, 2.0);

  return vec4(reflection, alpha);
}

#pragma glslify: export(glassColor)
