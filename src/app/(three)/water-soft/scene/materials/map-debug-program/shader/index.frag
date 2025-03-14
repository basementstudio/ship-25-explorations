precision highp float;

in vec2 vUv;

uniform sampler2D uMap;

out vec4 fragColor;

void main() {
  fragColor = texture(uMap, vUv);
}
