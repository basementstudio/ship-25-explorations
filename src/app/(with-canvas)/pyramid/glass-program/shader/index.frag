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

const float diskSize = 0.04;

vec3 lightDirection = normalize(vec3(2.0, -0.5, 4.0));
float glossiness = 0.1;

float getSpecular() {
  vec2 surfaceNormal = getSurfaceNormal(vUv);
  vec3 rotatedNormal = rotateVector2(normalize(vNormal), surfaceNormal * 0.07);

  float lambert = max(0.0, dot(lightDirection, rotatedNormal));

  float specularExponent = pow(2.0, glossiness * 3.0) + 10.0;
  float specular = dot(rotatedNormal, lightDirection);
  specular = abs(specular);
  specular = pow(specular, specularExponent);
  specular = specular * smoothstep(0.0, 1.0, lambert * 2.0);
  specular = specular * glossiness;
  specular = clamp(specular, 0.0, 1.0);
  return specular;
}

vec3 getColor() {
  vec4 baseSample = texture2D(uRaymarchTexture, vScreenUV);
  float depth = texture2D(uDepthTexture, vScreenUV).r;
  depth = valueRemap(depth, 0.1, 0.5, 0.0, 1.0);
  depth = clamp(depth, 0.0, 1.0);
  depth = smoothstep(0.0, 1.0, depth);

  vec4 color = glassColor(vScreenUV, depth * diskSize);
  color.rgb = mix(vec3(0.6), color.rgb, color.a);

  return color.rgb;
}

void main() {
  vec3 color = getColor();
  float specular = getSpecular();

  color += vec3(specular);

  gl_FragColor = vec4(color, 1.0);
}
