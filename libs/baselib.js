class Camera {
  constructor(){
    this.noclip = false;
    this.baseposition = vec3.fromValues(0,4,-25);
    this.addposition = vec3.fromValues(0,0,0);
    this.baserotation = vec3.fromValues(5,0,0);
    this.addrotation = vec3.fromValues(0,0,0);
  }

  move(x, z){
    var dir = this.getDirVec();
    var xdir = vec3.scale(vec3.create(), dir, z);

    var zdir = vec3.rotateY(vec3.create(), dir, vec3.create(), Math.PI / 2);
    zdir[1] = 0;
    vec3.normalize(zdir, zdir);
    vec3.scale(zdir, zdir, x);

    var newAddPos = vec3.create();

    vec3.add(newAddPos, this.addposition, xdir);
    vec3.add(newAddPos, newAddPos, zdir);

    this.addposition = this.limitPosition(newAddPos);
  }

  getDirVec(){
    var dir = vec3.fromValues(0, 0, 1);
    var rad = this.getRadians();
    vec3.rotateX(dir, dir, vec3.create(), rad[0]);
    vec3.rotateY(dir, dir, vec3.create(), rad[1]);
    vec3.rotateZ(dir, dir, vec3.create(), rad[2]);
    vec3.normalize(dir, dir);
    return dir;
  }

  getRadians(){
    var rad = [];
    var rotation = this.getRotation();
    for (var i = 0; i < 3; i++) {
      rad[i] = this.convertToRad(rotation[i]);
    }
    return rad;
  }

  convertToRad(rotation){
    return rotation * Math.PI / 180;
  }

  limitPosition(newAddPos){
    var totalPos = vec3.create();
    vec3.add(totalPos, this.baseposition, newAddPos);
    var len = vec3.length(totalPos);
    if(len > 46 && totalPos[1] < 0.5)
    {
      return this.addposition;
    } else {
      if(totalPos[1] < 0.5){
        newAddPos[1] += (0.5 - totalPos[1]);
        return newAddPos;
      }
      if(len > 46){
        vec3.scale(totalPos, totalPos, 46 / len);
      }
      return vec3.subtract(totalPos, totalPos, this.baseposition);
    }
    return newAddPos;
  }

  getPosition(){
    return vec3.add(vec3.create(), this.baseposition, this.addposition);
  }

  getRotation(){
    return vec3.add(vec3.create(), this.baserotation, this.addrotation);
  }

  resetPosition(){
    this.addposition = vec3.fromValues(0,0,0);
  }

  resetRotation(){
    this.addrotation = vec3.fromValues(0,0,0);
  }

  reset(){
    this.resetPosition();
    this.resetRotation();
  }
}

class Light {
  constructor(position, ambient, diffuse, specular)
  {
    this.position = position;
    this.ambient = ambient;
    this.diffuse = diffuse;
    this.specular = specular;
  }

  setParameters(lightNode, i){
    //lightNode.position = this.position;
    lightNode.ambient = this.ambient;
    lightNode.diffuse = this.diffuse;
    lightNode.specular = this.specular;
    lightNode.uniform += i != null ? i : '';
  }
}

/*
 *  Copy of LightSGNode that is NOT a TransformationSGNode, because I have no idea why adding a light should change the position of all child elements in the Scene Graph
 *  Also, the LightSGNode constructor does not work, it calls the TransformationSGNode constructor with first parameter children whereas TSGNode expects a matrix
 */
class MyLightSGNode extends SGNode {

 constructor(children, light, i) {
   super(children);
   this.position = light.position;
   this.ambient = light.ambient;
   this.diffuse = light.diffuse;
   this.specular = light.specular;
   //uniform name
   this.uniform = 'u_light' + i != null ? i : '';

   this._worldPosition = null;
 }

 setLightUniforms(context) {
   const gl = context.gl;
   //no materials in use
   if (!context.shader || !isValidUniformLocation(gl.getUniformLocation(context.shader, this.uniform+'.ambient'))) {
     return;
   }
   gl.uniform4fv(gl.getUniformLocation(context.shader, this.uniform+'.ambient'), this.ambient);
   gl.uniform4fv(gl.getUniformLocation(context.shader, this.uniform+'.diffuse'), this.diffuse);
   gl.uniform4fv(gl.getUniformLocation(context.shader, this.uniform+'.specular'), this.specular);
 }

 setLightPosition(context) {
   const gl = context.gl;
   if (!context.shader || !isValidUniformLocation(gl.getUniformLocation(context.shader, this.uniform+'Pos'))) {
     return;
   }
   const position = this._worldPosition || this.position;
   gl.uniform3f(gl.getUniformLocation(context.shader, this.uniform+'Pos'), position[0], position[1], position[2]);
 }

 computeLightPosition(context) {
   //transform with the current model view matrix
   const modelViewMatrix = mat4.multiply(mat4.create(), context.viewMatrix, context.sceneMatrix);
   const original = this.position;
   const position =  vec4.transformMat4(vec4.create(), vec4.fromValues(original[0], original[1],original[2], 1), modelViewMatrix);

   this._worldPosition = position;
 }

 /**
  * set the light uniforms without updating the last light position
  */
 setLight(context) {
   this.setLightPosition(context);
   this.setLightUniforms(context);
 }

 render(context) {
   this.computeLightPosition(context);
   this.setLight(context);

   //render children
   super.render(context);
 }
}

class MultiLightSGNode extends SGNode {

  constructor(lights, children){
    super();
    this.lightNum = lights.length;
    this.top = children;
    for (var i = 0; i < lights.length; i++) {
      var lightNode = new MyLightSGNode(this.top, lights[i], i);
      lights[i].setParameters(lightNode, i);
      lightNode.children = [this.top];
      lightNode.matrix = mat4.translate(mat4.create(), mat4.create(), vec3.negate(vec3.create(), lights[i].position));
      this.top = lightNode;
    }
    this.children = [this.top];
  }

  render(context) {
    gl.uniform1i(gl.getUniformLocation(context.shader, 'u_lightNum'), this.lightNum);
    super.render(context);
  }
}

class ExtendedMaterialSGNode extends MaterialSGNode {

  constructor(ambient, diffuse, specular, emission, shininess, children){
    super(children);
    this.ambient = ambient;
    this.diffuse = diffuse;
    this.specular = specular;
    this.emission = emission;
    this.shininess = shininess;
  }
}

/**
 *
 **/
class TriTextureSGNode extends SGNode {
  constructor(image1, repeat1, image2, repeat2, alphaimage, alpharepeat, children) {
    super(children);
    this.images = [image1, image2, alphaimage];
    this.repeats = [repeat1, repeat2, alpharepeat];
    this.textureunits = [0, 1, 2];
    this.texCoords = ['a_texCoord1', 'a_texCoord2', 'a_alphatexCoord'];
    this.texCoordLocs = [];
    this.texCoordBuffers = [];
    this.uniforms = ['u_texture1', 'u_texture2', 'u_alphatexture'];
    this.textureIds = null;
  }

  init(context) {
    const gl = context.gl;
    this.textureIds = [];
    for (var i = 0; i < 3; i++) {
      this.textureIds[i] = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.textureIds[i]);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter || gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter || gl.LINEAR);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS || gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT || gl.REPEAT);

      if (i < 2) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.images[i]);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, gl.ALPHA, gl.UNSIGNED_BYTE, this.images[i]);
      }

      gl.bindTexture(gl.TEXTURE_2D, null);

      this.texCoordBuffers = this.texCoordBuffers.concat(gl.createBuffer());
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffers[i]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, this.repeats[i], 0, this.repeats[i], this.repeats[i], 0, this.repeats[i]]), gl.STATIC_DRAW);
      this.texCoordLocs = this.texCoordLocs.concat(gl.getAttribLocation(context.shader, this.texCoords[i]));
    }
  }

  render(context) {

    if (this.textureIds == null) {
      this.init(context);
    }
    //set additional shader parameters
    for (var i = 0; i < 3; i++) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffers[i]);
      gl.enableVertexAttribArray(this.texCoordLocs[i]);
      gl.vertexAttribPointer(this.texCoordLocs[i], 2, gl.FLOAT, false, 0, 0);

      gl.uniform1i(gl.getUniformLocation(context.shader, this.uniforms[i]), this.textureunits[i]);

      //activate and bind texture
      gl.activeTexture(gl.TEXTURE0 + this.textureunits[i]);
      gl.bindTexture(gl.TEXTURE_2D, this.textureIds[i]);
    }

    //render children
    super.render(context);

    for (var i = 0; i < 3; i++) {
      //clean up
      gl.disableVertexAttribArray(this.texCoordLocs[i]);
      gl.activeTexture(gl.TEXTURE0 + this.textureunits[i]);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }
}

class SetUniformsSGNode extends SetUniformSGNode {
  constructor(uniforms, values, children) {
    if (uniforms.constructor.name !== 'Array' || values.constructor.name !== 'Array' || uniforms.length != values.length)
      throw "Illegal Arguments for SetUniformsSGNode";
    super(uniforms[0], values[0], uniforms.length > 1 ? new SetUniformsSGNode(uniforms.splice(0, 1), values.splice(0, 1), children) : children);
  }
}

class SkyboxSGNode extends SGNode {

  constructor(cubetexture, textureunit, children) {
    super(children);
    this.cubetexture = cubetexture;
    this.textureunit = textureunit;
  }

  render(context) {
    var invView3x3 = mat3.fromMat4(mat3.create(), context.invViewMatrix);
    gl.uniformMatrix3fv(gl.getUniformLocation(context.shader, 'u_invView'), false, invView3x3);
    ///console.log(gl.getUniformLocation(context.shader, 'u_invView'));
    gl.uniform1i(gl.getUniformLocation(context.shader, 'u_texCube'), this.textureunit);

    //activate and bind texture
    gl.activeTexture(gl.TEXTURE0 + this.textureunit);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubetexture);

    //render children
    super.render(context);

    //clean up
    gl.activeTexture(gl.TEXTURE0 + this.textureunit);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  }
}

class WaterSGNode extends SGNode {

  constructor(children) {
    super(children);
  }

  render(context) {
    gl.uniform1f(gl.getUniformLocation(context.shader, 'a_shift'), context.shift);

    super.render(context);
  }
}

function initSceneCube(scene, textureunit) {
  //create the texture
  const texture = gl.createTexture();
  //define some texture unit we want to work on
  gl.activeTexture(gl.TEXTURE0 + textureunit);
  //bind the texture to the texture unit
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
  //set sampling parameters
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
  //gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.MIRRORED_REPEAT); //will be available in WebGL 2
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  //set correct image for each side of the cube map
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scene.env_l);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scene.env_r);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scene.env_u);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scene.env_d);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scene.env_f);
  gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scene.env_b);
  //generate mipmaps (optional)
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  //unbind the texture again
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  //reset flipping

  return texture;
}
