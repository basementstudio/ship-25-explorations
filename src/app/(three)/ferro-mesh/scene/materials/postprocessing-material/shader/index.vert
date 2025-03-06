precision highp float;

in vec3 position;
in vec2 uv;

out vec2 vUv;

void main() {
  // Pass UV coordinates to fragment shader
  vUv = uv;

  // Just use the position directly without transformations
  gl_Position = vec4(position, 1.0);
}
