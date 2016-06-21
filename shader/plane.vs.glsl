precision mediump float;

attribute vec3 a_position;
attribute vec3 a_color;
attribute vec3 a_normal;

varying vec3 v_color;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;
uniform mat3 u_invView;

uniform vec3 u_light0Pos;
uniform vec3 u_light1Pos;

varying vec3 v_position;
varying vec3 v_eyeVec;
varying vec3 v_light0Vec;
varying vec3 v_light1Vec;

varying vec3 v_cameraRayVec;
varying vec3 v_normalVec;

void main() {
  v_color = a_color;

  vec4 eyePosition = u_modelView * vec4(a_position, 1);

  v_cameraRayVec = u_invView * eyePosition.xyz;

  v_normalVec = u_invView * u_normalMatrix * a_normal;

  v_light0Vec = u_light0Pos - eyePosition.xyz;
  v_light1Vec = u_light1Pos - eyePosition.xyz;

  gl_Position = u_projection * eyePosition;
}
