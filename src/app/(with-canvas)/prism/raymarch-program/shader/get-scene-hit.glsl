#pragma glslify: cnoise4d = require('glsl-noise/classic/4d')

float sdSphere(vec3 position, float radius) {
  return length(position) - radius;
}

const float sphereRadius = 0.3;

float getSceneHit(vec3 p) {
  float heartFactor = smoothstep(-1.0, 0.0, sin(time * 5.0));
  float heartFactor2 = smoothstep(-1.0, 1.0, sin(time * 2.0));

  vec4 pNoise1 = vec4(p * 5.0, time * 1.0);
  float noise1 = cnoise4d(pNoise1);
  // noise1 = noise1 * 0.5 + 0.5;
  // noise1 = pow(noise1, 2.0);
  noise1 *= 0.2 * heartFactor;

  vec4 pNoise2 = vec4(p * 10.0, time * 10.0);
  float noise2 = cnoise4d(pNoise2);
  noise2 *= 0.03;
  // noise2 *= heartFactor2;

  float noise = noise1 + noise2;

  vec3 sphereCenter = vec3(0.0, -0.3, 0.0);
  vec3 sphereP = p - sphereCenter;

  return sdSphere(sphereP, sphereRadius) - noise;
}

#pragma glslify: export(getSceneHit)
