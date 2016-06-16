attribute vec3 a_position;
attribute vec2 a_texCoord1;
attribute vec2 a_texCoord2;
attribute vec2 a_alphatexCoord;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;

varying vec2 v_texCoord1;
varying vec2 v_texCoord2;
varying vec2 v_alphatexCoord;

void main() {
	v_texCoord1 = a_texCoord1;
	v_texCoord2 = a_texCoord2;
	v_alphatexCoord = a_alphatexCoord;

	gl_Position = u_projection * u_modelView  * vec4(a_position, 1);
}
