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

uniform Light u_light0;
uniform Light u_light1;
uniform Light u_light2;
uniform Light u_light3;
uniform int u_lightNum;
uniform float u_shift;

uniform samplerCube u_texCube;

varying float v_angle;
varying float v_height;
varying vec4 v_color;

varying vec3 v_eyeVec;
varying vec3 v_light0Vec;
varying vec3 v_light1Vec;
varying vec3 v_light2Vec;
varying vec3 v_light3Vec;

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
	vec4 c_em   = material.emission;

	return c_amb + c_diff + c_spec + c_em;
}

void main() {
	//vec3 normalVec = vec3(0,0,1);
	vec3 normalVec = normalize(v_normalVec);
	vec3 cameraRayVec = normalize(v_cameraRayVec);
	//
	normalVec = vec3(normalVec.x, normalVec.y * cos(v_angle) - normalVec.z * sin(v_angle), normalVec.y * sin(v_angle) + normalVec.z * cos(v_angle));
	normalVec = normalize(normalVec);

	vec3 texCoords  = reflect(cameraRayVec, normalVec);
	//gl_FragColor = vec4(textureCube(u_texCube, texCoords).xyz * v_height, 1.0);
	//gl_FragColor = vec4(0.3,0.3, 0.8, 1);
	gl_FragColor =  textureCube(u_texCube, texCoords);
	//gl_FragColor = vec4(normalVec, 1);
	//gl_FragColor = vec4(v_height/2.0, v_height/2.0, v_height/2.0, 1);
	//float col = v_angle/100.0 - float(int(v_angle)/100)+0.5;
	//gl_FragColor = vec4(col, col, col, 1);
	// if(u_lightNum == 0){
	// 	gl_FragColor = color;
	// } else {
	// 	gl_FragColor = calculateSimplePointLight(u_light0, u_material, v_light0Vec, v_normalVec, v_eyeVec);
	// 	if(u_lightNum > 1){
	// 		gl_FragColor += calculateSimplePointLight(u_light1, u_material, v_light1Vec, v_normalVec, v_eyeVec);
	// 	}
	// 	if(u_lightNum > 2){
	// 		gl_FragColor += calculateSimplePointLight(u_light2, u_material, v_light2Vec, v_normalVec, v_eyeVec);
	// 	}
	// 	if(u_lightNum > 3){
	// 		gl_FragColor += calculateSimplePointLight(u_light3, u_material, v_light3Vec, v_normalVec, v_eyeVec);
	// 	}
	// }
}
