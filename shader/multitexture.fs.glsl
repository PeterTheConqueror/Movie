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


uniform bool u_useSecond;

uniform Light u_light0;
uniform Light u_light1;
uniform vec3 u_light0Pos;
uniform vec3 u_light1Pos;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;
uniform sampler2D u_alphatexture;

varying vec3 v_light0Vec;
varying vec3 v_light1Vec;

varying vec2 v_texCoord1;
varying vec2 v_texCoord2;
varying vec2 v_alphatexCoord;

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
			return vec4(0,0,0,0);
		}
	}else{
		return calculateSimplePointLight(light, material, lightVec, normalVec, eyeVec);
	}
}

void main() {
  float alpha = texture2D(u_alphatexture, v_alphatexCoord).a;
  if(u_useSecond){
    gl_FragColor = vec4(
      alpha * texture2D(u_texture1, v_texCoord1).rgb
    + (1.0 - alpha) * texture2D(u_texture2, v_texCoord2).rgb
    , 0.85);
  }else{
    gl_FragColor = vec4(alpha * texture2D(u_texture1, v_texCoord1).rgb, alpha);
  }
}
