#version 300 es

precision highp float;

in vec3 vNormal;
in vec3 vViewNormal;
in vec2 vUv;
in vec3 wPos;
in vec3 viewDirection;

uniform vec3 cameraPosition;

// light
uniform sampler2D uEnvMap;

out vec4 FragData[2];

#pragma glslify: packRGB = require('../../glsl-shared/pack-rgb.glsl')
#pragma glslify: getEnvColor = require('../../glsl-shared/get-env-color.glsl', texture = texture)

void main() {
  // pack depth into first channel
  FragData[0] = vec4(packRGB(gl_FragCoord.z), 1.0);

  vec3 reflectedNormal = reflect(viewDirection, normalize(vNormal));

  // pack color into second channel
  FragData[1] = vec4(getEnvColor(uEnvMap, reflectedNormal), 1.0);
}
