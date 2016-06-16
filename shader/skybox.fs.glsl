precision mediump float;

varying vec3 v_normalVec;
varying vec3 v_cameraRayVec;

uniform samplerCube u_texCube;

void main() {
  vec3 normalVec = normalize(v_normalVec);
	vec3 cameraRayVec = normalize(v_cameraRayVec);

  gl_FragColor = textureCube(u_texCube, cameraRayVec);
}
