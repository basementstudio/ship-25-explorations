precision highp float;

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 wPos;
varying vec3 viewDirection;
varying vec2 vScreenUV;

uniform sampler2D uRaymarchTexture;
uniform sampler2D uDepthTexture;

#pragma glslify: glassColor = require('./glass.glsl', reflectionMap = uRaymarchTexture, time = time)
#pragma glslify: valueRemap = require('./value-remap.glsl')
#pragma glslify: getSurfaceNormal = require('../../glsl-shared/get-surface-normal.glsl')
#pragma glslify: rotateVector2 = require('../../glsl-shared/rotate-vector-2.glsl')

const float diskSize = 0.01;

vec3 lightDirection = normalize(vec3(1.0, -0.2, 2.0));
float glossiness = 0.5;
float normalScale = 0.05;

float getSpecular() {
  vec2 surfaceNormal = getSurfaceNormal(vUv);

  vec3 normal = normalize(vNormal);

  float lambert = max(0.0, dot(lightDirection, normal));

  float specularExponent = pow(2.0, glossiness * 10.0) + 10.0;
  float specular = dot(normal, lightDirection);
  specular = abs(specular);
  specular = pow(specular, specularExponent);
  specular = specular * smoothstep(0.0, 1.0, lambert * 2.0);
  specular = specular * glossiness;
  specular = clamp(specular, 0.0, 1.0);
  return specular;
}

vec3 getColor() {
  vec4 baseSample = texture2D(uRaymarchTexture, vScreenUV);

  // return baseSample.rgb; // todo remove
  float depth = texture2D(uDepthTexture, vScreenUV).r;
  depth = valueRemap(depth, 0.2, 0.9, 0.0, 1.0);
  depth = clamp(depth, 0.0, 1.0);
  // depth = smoothstep(0.0, 1.0, depth);

  vec4 color = glassColor(vScreenUV, depth * diskSize);
  color.rgb = mix(vec3(0.8), color.rgb, color.a);

  return color.rgb;
}

void main() {
  vec3 color = getColor();
  float specular = getSpecular();

  color += vec3(specular);

  gl_FragColor = vec4(color, 1.0);
}
