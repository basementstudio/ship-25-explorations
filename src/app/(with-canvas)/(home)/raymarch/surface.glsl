const vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
const vec3 lightColor = vec3(1.0, 1.0, 1.0);

// Normal calculation function (using gradient):
const vec3 GRADIENT_STEP = vec3(0.001, 0.0, 0.0);
vec3 getNormal(vec3 p) {
  float gradientX =
    getSceneHit(p + GRADIENT_STEP.xyy).dist -
    getSceneHit(p - GRADIENT_STEP.xyy).dist;
  float gradientY =
    getSceneHit(p + GRADIENT_STEP.yxy).dist -
    getSceneHit(p - GRADIENT_STEP.yxy).dist;
  float gradientZ =
    getSceneHit(p + GRADIENT_STEP.yyx).dist -
    getSceneHit(p - GRADIENT_STEP.yyx).dist;
  return normalize(vec3(gradientX, gradientY, gradientZ));
}

SurfaceResult getSurfaceLight(vec3 p, vec3 rd, RayHit hit) {
  vec3 viewDirection = -rd;
  Material hitMat = hit.material;
  vec3 normal = getNormal(p);

  // diffuse light
  float lambert = clamp(dot(normal, lightDirection), 0.0, 1.0);
  // global illumination
  lambert = clamp(lambert, 0.3, 1.0);
  vec3 vLambertLight = hitMat.color * lightColor * lambert;

  // specular light
  float specularExponent = pow(2.0, hitMat.glossiness * 10.0) + 20.0;
  vec3 halfVector = normalize(lightDirection + viewDirection);
  float specular = max(dot(halfVector, normal), 0.0);
  specular = pow(specular, specularExponent);
  specular = specular * smoothstep(0.0, 1.0, lambert * 2.0);
  specular = specular * hitMat.glossiness;
  vec3 vSpecularLight = lightColor * specular;

  // combining the two lights
  vec3 light = vLambertLight + vSpecularLight;

  return SurfaceResult(light, normal, hitMat.reflectivity);
}

#pragma glslify: export(getSurfaceLight)
