precision mediump float;

struct Material {
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
	vec4 emission;
	float shininess;
};

struct Light {
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
};

uniform Material u_material;

uniform Light u_light1;
uniform Light u_light2;

varying vec3 v_eyeVec;
varying vec3 v_light1Vec;
varying vec3 v_light2Vec;

varying vec3 v_cameraRayVec;
varying vec3 v_normalVec;

uniform samplerCube u_texCube;

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
	vec4 c_em   = material.emission;

	return c_amb + c_diff + c_spec + c_em;
}

void main() {
  vec3 normalVec = normalize(v_normalVec);
	vec3 cameraRayVec = normalize(v_cameraRayVec);

  vec3 texCoords  = reflect(cameraRayVec, normalVec);
  gl_FragColor = textureCube(u_texCube, texCoords);
  //gl_FragColor = vec4(0.3,0.3,0.7,1);
  //gl_FragColor =
  //  calculateSimplePointLight(u_light1, u_material, v_light1Vec, v_normalVec, v_eyeVec)
  //  + calculateSimplePointLight(u_light2, u_material, v_light2Vec, v_normalVec, v_eyeVec);
}
