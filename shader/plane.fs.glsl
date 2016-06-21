precision mediump float;

struct Material {
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
	vec4 emission;
	float shininess;
};

struct Light {
	bool enabled;
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
	bool spotlight;
	vec3 direction;
	float angle;
};


varying vec3 v_color;

uniform float u_alpha;

void main() {
  gl_FragColor = vec4(v_color, 1);
}
