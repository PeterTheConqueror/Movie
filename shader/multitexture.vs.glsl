precision mediump float;

attribute vec3 a_position;
attribute vec2 a_texCoord1;
attribute vec2 a_texCoord2;
attribute vec2 a_alphatexCoord;

uniform float u_shift;
uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;

varying vec2 v_texCoord1;
varying vec2 v_texCoord2;
varying vec2 v_alphatexCoord;

void main() {
	vec3 position = a_position;
	  float v_angle = (a_position.x + a_position.y)/1000.0 - u_shift;
  position.z += (sin(v_angle)+1.0);

	v_texCoord1 = a_texCoord1;
	v_texCoord2 = a_texCoord2;
	v_alphatexCoord = a_alphatexCoord;

	gl_Position = u_projection * u_modelView  * vec4(position, 1);
}
