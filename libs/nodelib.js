/*
*  Copy of LightSGNode that is NOT a TransformationSGNode, because I have no idea why adding a light should change the position of all child elements in the Scene Graph
*  Also, the LightSGNode constructor does not work, it calls the TransformationSGNode constructor with first parameter children whereas TSGNode expects a matrix
*/
class ExtendedLightSGNode extends LightSGNode {

  constructor(light, i, children) {
    super();
    this.children = typeof children !== 'undefined' ? [].concat(children) : [];
    //uniform name
    this.uniform = 'u_light' + (i != null ? i : '');
    this.position = light.position;
    this.ambient = light.ambient;
    this.diffuse = light.diffuse;
    this.specular = light.specular;
  }

  render(context){
    gl.uniform1i(gl.getUniformLocation(context.shader, this.uniform+'.enabled'), 1);
    super.render(context);
  }
}

/**
* Class for Spotlights
**/
class SpotlightSGNode extends ExtendedLightSGNode {

  constructor(light, i, children) {
    super(light, i, children);
    this.direction = light.direction;
    this.angle = light.angle;
  }

  setLightUniforms(context){
    if(this.prerender){
      this.prerender(context);
    }
    gl.uniform1i(gl.getUniformLocation(context.shader, this.uniform+'.spotlight'), 1);
    gl.uniform3fv(gl.getUniformLocation(context.shader, this.uniform+'.direction'), this.direction);
    gl.uniform1f(gl.getUniformLocation(context.shader, this.uniform+'.angle'), this.angle);
    super.setLightUniforms(context);
  }
}

/**
* Class for time-based rendering behaviour
**/
class TimeBasedTransformationSGNode extends TransformationSGNode{
  constructor(children){
    super(mat4.create(), children);
  }

  // Instances of this class can overrider prerender to change their behaviour depending on time
  render(context){
    if(this.prerender){
      this.prerender(context);
    }
    super.render(context);
  }
}

/**
* Convenience class for setting Materials
**/
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
* Class for Multitexturing (special effect)
**/
class MultiTextureSGNode extends SGNode {
  constructor(useSecond, alphaimage, alpharepeat, image1, repeat1, image2, repeat2, children) {
    super(children);
    this.useSecond = useSecond;
    this.images = [alphaimage, image1, image2];
    this.repeats = [alpharepeat, repeat1, repeat2];
    this.textureunits = [0, 1, 2];
    this.texCoords = ['a_alphatexCoord', 'a_texCoord1', 'a_texCoord2'];
    this.texCoordLocs = [];
    this.texCoordBuffers = [];
    this.uniforms = ['u_alphatexture', 'u_texture1', 'u_texture2'];
    this.textureIds = null;
  }

  init(context) {
    const gl = context.gl;
    this.textureIds = [];
    for (var i = 0; i < (this.useSecond ? 3 : 2); i++) {
      this.textureIds[i] = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.textureIds[i]);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter || gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter || gl.LINEAR);

      if(this.useSecond){
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS || gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT || gl.REPEAT);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS || gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT || gl.CLAMP_TO_EDGE);
      }

      if (i == 0) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, gl.ALPHA, gl.UNSIGNED_BYTE, this.images[i]);
      } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.images[i]);
      }

      gl.bindTexture(gl.TEXTURE_2D, null);

      this.texCoordBuffers = this.texCoordBuffers.concat(gl.createBuffer());
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffers[i]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, this.repeats[i], 0, this.repeats[i], this.repeats[i], 0, this.repeats[i]]), gl.STATIC_DRAW);
      this.texCoordLocs = this.texCoordLocs.concat(gl.getAttribLocation(context.shader, this.texCoords[i]));
    }
  }

  render(context) {
    gl.uniform1i(gl.getUniformLocation(context.shader, 'u_useSecond'), this.useSecond);

    if (this.textureIds == null) {
      this.init(context);
    }
    //set additional shader parameters
    for (var i = 0; i < (this.useSecond ? 3 : 2); i++) {
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

    for (var i = 0; i < (this.useSecond ? 3 : 2); i++) {
      //clean up
      gl.disableVertexAttribArray(this.texCoordLocs[i]);
      gl.activeTexture(gl.TEXTURE0 + this.textureunits[i]);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }
}

/**
* Class for setting Int/Bool uniforms (does not work with SetUniformSGNode)
**/
class SetIntUniformSGNode extends SGNode {
  constructor(uniform, value, children){
    super(children);
    this.uniform = uniform;
    this.value = value;
  }

  render(context){
    gl.uniform1i(gl.getUniformLocation(context.shader, this.uniform), this.value);
    super.render(context);
  }
}

/**
* Class for skyboxes
**/
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

/**
* Class for setting shift uniform
**/
class ShiftSGNode extends SGNode {

  constructor(children) {
    super(children);
  }

  render(context) {
    gl.uniform1f(gl.getUniformLocation(context.shader, 'u_shift'), context.time/3000);

    super.render(context);
  }
}

/**
* Class for transparent nodes (only allows rendernodes as children)
**/
class TransparentSGNode extends TransformationSGNode{

  constructor(matrix, color, child) {
    child instanceof RenderSGNode ? super(matrix,  child) : super();
    this.color = color;
  }

  render(context){
    gl.uniform4fv(gl.getUniformLocation(context.shader, 'u_color'), this.color);

    super.render(context);
  }
}

/**
* Class for ordering transparent nodes and rendering them in the correct order
**/
class TransparencySGNode extends ShaderSGNode {

  constructor(shader, opaqueNodes, transparentNodes) {
    super(shader, transparentNodes);
    //this.shader = shader;
    this.opaqueNodes = typeof opaqueNodes !== 'undefined' ? [].concat(opaqueNodes) : [];
  }

  appendNodes(nodes){
    this.children.concat(nodes);
  }

  appendOpaqueNodes(opaqueNodes) {
    this.opaqueNodes.concat(opaqueNodes);
  }

  appendOpaque(opaqueChild) {
    this.opaqueNodes.push(opaqueChild);
    return opaqueChild;
  }

  pushOpaque(opaqueChild) {
    return this.appendOpaque(opaqueChild);
  }

  render(context) {
    this.opaqueNodes.forEach(c => c.render(context));

    sortTranspObjects(context.sceneMatrix, camera.getPosition(), this);

    super.render(context);
  }
}

// We order the children of each node
// This will produce the correct iteration order for each layer of the tree,
// but might produce incorrect results for nodes on different layers
function sortTranspObjects(matrix, cam, node){

  const nodes = node.children;

  var array = [];

  for (var i = 0; i < nodes.length; i++) {

    // Calculate matrix of OpaqueSGNode
    let distance;
    let nodeMatrix = matrix;
    if(nodes[i].matrix){
      nodeMatrix = mat4.multiply(mat4.create(), matrix, nodes[i].matrix);
      // Translation (matrix elements [3, 7, 11]) of RenderSGNode = center of rendered Node
      // Calculate the distance between camera and nodecenter
      distance = vec3.distance(cam, [nodeMatrix[12], nodeMatrix[13], nodeMatrix[14]]);
    }else{
      //If node does not have a matrix we set distance to a big value
      //This will prevent nodes without own matrix from getting reordered all the time
      distance = 5000 + i;
    }

    // Map nodes to key-value pairs (key == distance from camera)
    array[i] = { key : distance, value : nodes[i] };

    // Call function recursively for all Nodes
    sortTranspObjects(nodeMatrix, cam, nodes[i]);
  }

  // Sort nodes by distance to camera
  //array = array.sort((a, b) => a.key - b.key);
  var array0 = array.sort((a, b) =>  b.key - a.key);

  // Map back from key-value pairs to nodes only
  for (var i = 0; i < array0.length; i++) {
    array0[i] = array0[i].value;
  }

  node.children = array0;
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

// Make color vector from a grey tone and an alpha value
function createGreyTone(grey, alpha){
  return [grey, grey, grey, alpha];
}
