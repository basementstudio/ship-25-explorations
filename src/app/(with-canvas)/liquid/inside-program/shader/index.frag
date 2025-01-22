#version 300 es

precision highp float;

in vec3 vNormal;
in vec3 vViewNormal;
in vec2 vUv;
in vec3 wPos;
in vec3 viewDirection;

uniform vec3 cameraPosition;

out vec4 FragData[2];

#pragma glslify: packRGB = require('../../glsl-shared/pack-rgb.glsl')

void main() {
  // pack depth into first channel
  FragData[0] = vec4(packRGB(gl_FragCoord.z), 1.0);

  // pack normal into second channel
  float specular = dot(vNormal, vec3(0.0, 1.0, 0.0));
  vec3 color = vec3(specular);

  FragData[1] = vec4(color, 1.0);
}
