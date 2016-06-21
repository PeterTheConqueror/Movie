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

uniform Material u_material;
uniform float u_alpha;

uniform Light u_light0;
uniform Light u_light1;
uniform vec3 u_light0Pos;
uniform vec3 u_light1Pos;

varying vec3 v_position;

varying vec3 v_eyeVec;
varying vec3 v_light0Vec;
varying vec3 v_light1Vec;

varying vec3 v_cameraRayVec;
varying vec3 v_normalVec;


vec4 calculateSimplePointLight(Light light, Material material, vec3 lightVec, vec3 normalVec, vec3 eyeVec) {
	lightVec = normalize(lightVec);
	normalVec = normalize(normalVec);
	eyeVec = normalize(eyeVec);

	float diffuse = max(dot(normalVec,lightVec),0.0);

	vec3 reflectVec = reflect(-lightVec,normalVec);
	float spec = pow(max(dot(reflectVec, eyeVec), 0.0), material.shininess);

	vec4 c_amb  = clamp(light.ambient * material.ambient, 0.0, 1.0);
	vec4 c_diff = clamp(diffuse * light.diffuse * material.diffuse, 0.0, 1.0);
	vec4 c_spec = clamp(spec * light.specular * material.specular, 0.0, 1.0);

	// Do not return emission because it is already in gl_FragColor
	return c_amb + c_diff + c_spec;
}

vec4 calculateLight(Light light, Material material, vec3 lightVec, vec3 normalVec, vec3 eyeVec, vec3 lightPos, vec3 position) {
	if(light.spotlight){
		float intensity = 0.0;
		vec4 spec = vec4(0.0);

		vec3 dir = normalize(lightVec);
		if(dot(dir, normalVec) > cos(light.angle)) {

    	float diffuse = max(dot(normalVec, light.direction), 0.0);

    	vec3 reflectVec = reflect(-lightPos, normalVec);
    	float spec = pow(max(dot(reflectVec, eyeVec), 0.0), material.shininess);

			vec4 c_amb  = clamp(light.ambient * material.ambient, 0.0, 1.0);
			vec4 c_diff = clamp(diffuse * light.diffuse * material.diffuse, 0.0, 1.0);
			vec4 c_spec = clamp(spec * light.specular * material.specular, 0.0, 1.0);

			// Do not return emission because it is already in gl_FragColor
			return c_amb + c_diff + c_spec;
		} else {
			return vec4(0,0,0,1);
		}
	}else{
		return calculateSimplePointLight(light, material, lightVec, normalVec, eyeVec);
	}
}

void main() {
	gl_FragColor = vec4(u_material.emission.xyz, 1);

	if(u_light0.enabled){
		gl_FragColor += vec4(calculateLight(u_light0, u_material, v_light1Vec, v_normalVec, v_eyeVec, u_light0Pos, v_position).xyz, 1);
	}

	if(u_light1.enabled){
		gl_FragColor += vec4(calculateLight(u_light1, u_material, v_light1Vec, v_normalVec, v_eyeVec, u_light1Pos, v_position).xyz, 1);
	}
}
