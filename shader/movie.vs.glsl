attribute vec3 a_color;
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_texCoord;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;
//uniform mat4 u_invView;

varying vec3 v_color;
varying vec2 v_texCoord;

void main() {
	//vec4 eyePosition = u_modelView * vec4(a_position,1);

  //v_normalVec = u_normalMatrix * a_normal;

  //v_eyeVec = -eyePosition.xyz;
	//v_lightVec = u_lightPos - eyePosition.xyz;

	////TASK 1: pass on texture coordinates to fragment shader

	//gl_Position = u_projection * eyePosition;

  gl_Position = u_projection * u_modelView  * vec4(a_position, 1);
  v_color = a_color;
	v_texCoord = a_texCoord;
}
