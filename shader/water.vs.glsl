precision mediump float;

float M_PI = 3.1415926535897932384626433832795;

attribute vec3 a_position;
attribute vec3 a_normal;

uniform bool u_mirror;
uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;
uniform mat3 u_invView;
uniform vec3 u_light0Pos;
uniform vec3 u_light1Pos;
uniform float u_shift;

varying float v_angle;

varying vec3 v_position;
varying vec3 v_eyeVec;
varying vec3 v_light0Vec;
varying vec3 v_light1Vec;

varying vec3 v_cameraRayVec;
varying vec3 v_normalVec;

void main() {
  vec3 translation;
  if(u_mirror){
    v_angle = (a_position.x + a_position.y)/100.0 - u_shift;
    translation = vec3(0, 0, (sin(v_angle) + 1.0)/1.0);
  } else {
    translation = vec3(0, 0, 0);
  }

  v_position = a_position + translation;

  vec4 eyePosition = u_modelView * vec4(v_position, 1);

  v_cameraRayVec = u_invView * eyePosition.xyz;

  v_normalVec = u_invView * u_normalMatrix * a_normal;

  v_light0Vec = u_light0Pos - eyePosition.xyz;
  v_light1Vec = u_light1Pos - eyePosition.xyz;

  gl_Position = u_projection * eyePosition;
}
