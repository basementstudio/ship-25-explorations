precision highp float;

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 wPos;
varying vec3 viewDirection;

varying vec2 vScreenUV;

uniform sampler2D uRaymarchTexture;

vec3 getColor() {
  vec4 sample = texture2D(uRaymarchTexture, vScreenUV);
  vec3 color = mix(vec3(0.7), sample.rgb, sample.a);
  return color;
}

void main() {
  vec3 color = getColor();
  gl_FragColor = vec4(color, 1.0);
}
