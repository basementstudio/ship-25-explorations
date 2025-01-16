#pragma glslify: cnoise3d = require('glsl-noise/classic/3d')

float sdSphere(vec3 position, float radius) {
  return length(position) - radius;
}

float getSceneHit(vec3 p) {
  float noise = cnoise3d((p + vec3(0.0, 0.0, time * 0.1)) * 20.0);
  noise = pow(noise, 2.0);
  noise *= 0.04;
  vec3 sphereCenter = vec3(0.0, -0.3, 0.0);
  vec3 sphereP = p - sphereCenter;

  return sdSphere(sphereP, 0.2) - noise;
}

#pragma glslify: export(getSceneHit)
