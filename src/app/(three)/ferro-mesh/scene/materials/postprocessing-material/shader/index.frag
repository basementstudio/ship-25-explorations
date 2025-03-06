precision highp float;

uniform sampler2D baseMap;

in vec2 vUv;
out vec4 fragColor;

void main() {
  // Sample the baseMap using the UV coordinates
  fragColor = texture(baseMap, vUv);
}
