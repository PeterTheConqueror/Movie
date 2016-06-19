float M_PI = 3.1415926535897932384626433832795;
attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;
uniform mat3 u_invView;
uniform vec3 u_light0Pos;
uniform vec3 u_light1Pos;
uniform vec3 u_light2Pos;
uniform vec3 u_light3Pos;
uniform float shift;

varying float v_height;

varying vec3 v_eyeVec;
varying vec3 v_light0Vec;
varying vec3 v_light1Vec;
varying vec3 v_light2Vec;
varying vec3 v_light3Vec;

varying vec3 v_cameraRayVec;
varying vec3 v_normalVec;

void main() {
  v_height = 1.0*(sin((a_position.x + a_position.y + shift) * M_PI) + 1.0);

  vec4 eyePosition = u_modelView * vec4(a_position.x, a_position.y + v_height, a_position.z, 1);
  //vec4 eyePosition = u_modelView * vec4(a_position, 1);

  v_cameraRayVec = u_invView * eyePosition.xyz;

  v_normalVec = u_invView * u_normalMatrix * a_normal;
  //v_normalVec = a_normal;

  // v_light0Vec = u_light0Pos - eyePosition.xyz;
  // v_light1Vec = u_light1Pos - eyePosition.xyz;
  // v_light2Vec = u_light2Pos - eyePosition.xyz;
  // v_light3Vec = u_light3Pos - eyePosition.xyz;

  gl_Position = u_projection * eyePosition;

  //gl_Position = u_projection * u_modelView * vec4(a_position,1);

  //v_normalVec = u_normalMatrix * a_normal;

  //v_eyeVec = -eyePosition.xyz;

  ////TASK 1: pass on texture coordinates to fragment shader

  //gl_Position = u_projection * eyePosition;

  //gl_Position = u_projection * u_modelView  * vec4(a_position, 1);
  //v_color = a_color;
  //v_texCoord = a_texCoord;
  //gl_Position = vec4(a_position, 1);
}
