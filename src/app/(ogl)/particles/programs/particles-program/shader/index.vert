#version 300 es

precision highp float;

in vec3 position;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

void main() {
  // positions are 0->1, so make -1->1
  vec3 pos = position - 0.5;

  // modelMatrix is one of the automatically attached uniforms when using the Mesh class
  vec4 mPos = modelMatrix * vec4(pos, 1.0);

  // get the model view position so that we can scale the points off into the distance
  vec4 mvPos = viewMatrix * mPos;
  gl_PointSize = 20.0;
  gl_Position = vec4(pos, 0.5);
}
