//size of pyramid
var s = 0.5;
var h = 0.5;
var pyramidVertices = new Float32Array([
  // // Front
  // -s,  h,  (s * 1.4142/2),
  // 0.0, 0.0,  0.0,
  // s, 0.0,  0.0,
  // // Back
  // (s * 1.4142/2),  h,  (s * 1.4142/2),
  // 0.0, 0.0,  s,
  // s, 0.0, s,
  // // Left
  // (s * 1.4142/2),  h,  (s * 1.4142/2),
  // 0.0, 0.0, s,
  // 0.0, 0.0, 0.0,
  // // Right
  // (s * 1.4142/2),  h,  (s * 1.4142/2),
  // s, 0.0, s,
  // s, 0.0,  0.0,

  // Base
  -s,  0.0,  -s,
  -s, 0.0,  s,
  s, 0.0,  -s,
  s, 0.0, s,
  // Tip
  0, h, 0,
  // Normal of Base
  0, 1, 0,
  // Normal of Sides (easy to calculate because h == s)
  1, -1, 0,
  -1, 1, 0,
  1, 1, 0,
  1, 1, 0,
]);

var pyramidColors = new Float32Array([
  0,1,1, 0,1,1, 0,1,1, 0,1,1,
  1,0,1, 1,0,1, 1,0,1, 1,0,1,
  1,0,0, 1,0,0, 1,0,0, 1,0,0,
]);

var pyramidIndices =  new Float32Array([
  0,1,2, 1,2,3,
  0,1,4, 0,2,4,
  1,3,4, 2,3,4
]);

//size of triangular Prism
var a = 0.5;
var b = 0.8;
var c = 0.94;
var d = 0.3;

var triangularPrismVertices = new Float32Array([
  // Front
  0.0,  0.0,  0.0,
  a, 0.0,  0.0,
  a, b,  0.0,
  // Back
  0.0,  0.0,  -d,
  a, 0.0,  -d,
  a, b,  -d,
  // Left
  0.0,  0.0,  -d,
  0.0, 0.0,  0.0,
  a, b,  0.0,
  a, b,  -d,
  // Right
  a, 0.0,  -d,
  a, 0.0,  0.0,
  a, b,  0.0,
  a, b,  -d,
  // Bot
  0.0,  0.0,  -d,
  0.0,  0.0,  0.0,
  a, 0.0,  -d,
  a, 0.0,  0.0,
]);
var triangularPrismColors = new Float32Array([
  0,1,1, 0,1,1, 0,1,1,
  1,0,1, 1,0,1, 1,0,1,
  1,0,0, 1,0,0, 1,0,0, 1,0,0,
  0,0,1, 0,0,1, 0,0,1, 0,0,1,
  1,1,0, 1,1,0, 1,1,0, 1,1,0,
]);
var triangularPrismIndices =  new Float32Array([
  0,1,2, 3,4,5,
  6,7,8, 6,9,8,
  10,11,12, 10,13,12,
  14,15,16, 14,17,16,
]);

var s = 0.3; //size of cube
var cubeVertices = new Float32Array([
  -s,-s,-s, s,-s,-s, s, s,-s, -s, s,-s,
  -s,-s, s, s,-s, s, s, s, s, -s, s, s,
  -s,-s,-s, -s, s,-s, -s, s, s, -s,-s, s,
  s,-s,-s, s, s,-s, s, s, s, s,-s, s,
  -s,-s,-s, -s,-s, s, s,-s, s, s,-s,-s,
  -s, s,-s, -s, s, s, s, s, s, s, s,-s,
]);
var cubeColors = new Float32Array([
  0,1,1, 0,1,1, 0,1,1, 0,1,1,
  1,0,1, 1,0,1, 1,0,1, 1,0,1,
  1,0,0, 1,0,0, 1,0,0, 1,0,0,
  0,0,1, 0,0,1, 0,0,1, 0,0,1,
  1,1,0, 1,1,0, 1,1,0, 1,1,0,
  0,1,0, 0,1,0, 0,1,0, 0,1,0
]);
var cubeIndices =  new Float32Array([
  0,1,2, 0,2,3,
  4,5,6, 4,6,7,
  8,9,10, 8,10,11,
  12,13,14, 12,14,15,
  16,17,18, 16,18,19,
  20,21,22, 20,22,23
]);

var cubeVertexTextureCoordBuffer;
var textureCoords = new Float32Array ([
  // Front face
  0.0, 0.0,
  1.0, 0.0,
  1.0, 1.0,
  0.0, 1.0,
  // Back face
  1.0, 0.0,
  1.0, 1.0,
  0.0, 1.0,
  0.0, 0.0,
  // Top face
  0.0, 1.0,
  0.0, 0.0,
  1.0, 0.0,
  1.0, 1.0,
  // Bottom face
  1.0, 1.0,
  0.0, 1.0,
  0.0, 0.0,
  1.0, 0.0,
  // Right face
  1.0, 0.0,
  1.0, 1.0,
  0.0, 1.0,
  0.0, 0.0,
  // Left face
  0.0, 0.0,
  1.0, 0.0,
  1.0, 1.0,
  0.0, 1.0,
]);

//links to buffer stored on the GPU
var pyramidVertexBuffer, pyramidColorBuffer, pyramidIndexBuffer;
var cubeVertexBuffer, cubeColorBuffer, cubeIndexBuffer;
var triangularPrismVertexBuffer, triangularPrismColorBuffer, triangularPrismIndexBuffer;

function setUpPlane(gl, resources) {
  const planeShader = new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single));

  plane = new TransformationSGNode();

  planeShader.append(new TransformationSGNode(glm.transform({ scale: 0.4, translate: [0, 1.5, 0]}), plane));

  //---------------------------------------------------------------------------------------------------------------------------
  // Transformation for all propellers
  //---------------------------------------------------------------------------------------------------------------------------

  propeller = new TransformationSGNode();

  plane.append(new TransformationSGNode(glm.transform({ translate:  [-1.24, 0, 0], scale: 0.4 }),propeller));

  //Transformation of 1st probeller wings
  var firstPropellerWingTransformationMatrix = glm.rotateX(0);
  firstPropellerWingTransformationMatrix = mat4.multiply(mat4.create(), firstPropellerWingTransformationMatrix, glm.scale(0.5,2,2));
  var firstPropellerWingTransformationNode = new TransformationSGNode(firstPropellerWingTransformationMatrix);
  propeller.append(firstPropellerWingTransformationNode);

  //  triangularPrismNode = new TriangularPrismRenderSGNode();
  firstPropellerWingTransformationNode.append(new TriangularPrismRenderSGNode());
  //Transformation of 2nd probeller wings
  var secondPropellerWingTransformationMatrix = glm.rotateX(90);
  secondPropellerWingTransformationMatrix = mat4.multiply(mat4.create(), secondPropellerWingTransformationMatrix, glm.scale(0.5,2,2));
  var secondPropellerWingTransformationNode = new TransformationSGNode(secondPropellerWingTransformationMatrix);
  propeller.append(secondPropellerWingTransformationNode);

  //triangularPrismNode = new TriangularPrismRenderSGNode();
  secondPropellerWingTransformationNode.append(new TriangularPrismRenderSGNode());
  //Transformation of 3rd probeller wings
  var thirdPropellerWingTransformationMatrix = glm.rotateX(180);
  thirdPropellerWingTransformationMatrix = mat4.multiply(mat4.create(), thirdPropellerWingTransformationMatrix, glm.scale(0.5,2,2));
  var thirdPropellerWingTransformationNode = new TransformationSGNode(thirdPropellerWingTransformationMatrix);
  propeller.append(thirdPropellerWingTransformationNode);

  //  triangularPrismNode = new TriangularPrismRenderSGNode();
  thirdPropellerWingTransformationNode.append(new TriangularPrismRenderSGNode());
  //Transformation of 4th probeller wings
  var fourthPropellerWingTransformationMatrix = glm.rotateX(270);
  fourthPropellerWingTransformationMatrix = mat4.multiply(mat4.create(), fourthPropellerWingTransformationMatrix, glm.scale(0.5,2,2));
  var fourthPropellerWingTransformationNode = new TransformationSGNode(fourthPropellerWingTransformationMatrix);
  propeller.append(fourthPropellerWingTransformationNode);

  //  triangularPrismNode = new TriangularPrismRenderSGNode();
  fourthPropellerWingTransformationNode.append(new TriangularPrismRenderSGNode());
  //---------------------------------------------------------------------------------------------------------------------------
  // Transformation for the entire plane
  //---------------------------------------------------------------------------------------------------------------------------

  //---------------------------------------------------------------------------------------------------------------------------
  //Transformation of Core
  //---------------------------------------------------------------------------------------------------------------------------
  var coreTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.scale(3,1,1));
  var coreTransformationNode = new TransformationSGNode(coreTransformationMatrix);
  plane.append(coreTransformationNode);

  //  cubeNode = new CubeRenderSGNode();
  coreTransformationNode.append(new CubeRenderSGNode());
  //---------------------------------------------------------------------------------------------------------------------------
  //Transformation of Wings
  //---------------------------------------------------------------------------------------------------------------------------
  //Transformation of left wings
  var leftWingTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(0,0,-0.5));
  leftWingTransformationMatrix = mat4.multiply(mat4.create(), leftWingTransformationMatrix, glm.scale(1.3,0.2,2.5));
  var leftWingTransformationNode = new TransformationSGNode(leftWingTransformationMatrix);
  plane.append(leftWingTransformationNode);

  //  cubeNode = new CubeRenderSGNode();
  leftWingTransformationNode.append(new CubeRenderSGNode());
  //Transformation of right wings
  var rightWingTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(0,0,0.5));
  rightWingTransformationMatrix = mat4.multiply(mat4.create(), rightWingTransformationMatrix, glm.scale(1.3,0.2,2.5));
  var rightWingTransformationNode = new TransformationSGNode(rightWingTransformationMatrix);
  plane.append(rightWingTransformationNode);

  //  cubeNode = new CubeRenderSGNode();
  rightWingTransformationNode.append(new CubeRenderSGNode());
  //Transformation of back wings
  var backWingTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(1.3,0.3,0));
  backWingTransformationMatrix = mat4.multiply(mat4.create(), backWingTransformationMatrix, glm.rotateY(180));
  backWingTransformationMatrix = mat4.multiply(mat4.create(), backWingTransformationMatrix, glm.scale(1.5,0.5,0.5));
  var backWingTransformationNode = new TransformationSGNode(backWingTransformationMatrix);
  plane.append(backWingTransformationNode);

  //    triangularPrismNode = new TriangularPrismRenderSGNode();
  backWingTransformationNode.append(new TriangularPrismRenderSGNode());
  //---------------------------------------------------------------------------------------------------------------------------
  //Transformation of cockpit
  //---------------------------------------------------------------------------------------------------------------------------
  var cockpitTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.translate(-0.2,0.5,0));
  cockpitTransformationMatrix = mat4.multiply(mat4.create(), cockpitTransformationMatrix, glm.scale(0.7,0.7,0.7));
  cockpitTransformationNode = new TransformationSGNode(cockpitTransformationMatrix);
  plane.append(cockpitTransformationNode);

  //  cubeNode = new CubeRenderSGNode();
  cockpitTransformationNode.append(new CubeRenderSGNode());
  //---------------------------------------------------------------------------------------------------------------------------
  //Transformation of front
  //---------------------------------------------------------------------------------------------------------------------------
  var frontTransformationMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.rotateZ(90));
  frontTransformationMatrix = mat4.multiply(mat4.create(), frontTransformationMatrix, glm.translate(0,0.9,0));
  frontTransformationMatrix = mat4.multiply(mat4.create(), frontTransformationMatrix, glm.scale(0.6,0.6,0.6));
  var frontTransformationNode = new TransformationSGNode(frontTransformationMatrix);
  plane.append(frontTransformationNode);

  //  pyramidNode = new PyramidRenderSGNode();
  frontTransformationNode.append(new PyramidRenderSGNode());

  return planeShader;
}

function initpyramidBuffer() {

  pyramidVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, pyramidVertices, gl.STATIC_DRAW);

  pyramidColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pyramidColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, pyramidColors, gl.STATIC_DRAW);

  pyramidIndexBuffer = gl.createBuffer ();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramidIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(pyramidIndices), gl.STATIC_DRAW);
}

function initCubeBuffer() {

  cubeVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

  cubeColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);

  cubeVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, textureCoords, gl.STATIC_DRAW);

  cubeIndexBuffer = gl.createBuffer ();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);
}

function initTriangularPrismBuffer() {

  triangularPrismVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangularPrismVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, triangularPrismVertices, gl.STATIC_DRAW);

  triangularPrismColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangularPrismColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, triangularPrismColors, gl.STATIC_DRAW);

  triangularPrismIndexBuffer = gl.createBuffer ();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangularPrismIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangularPrismIndices), gl.STATIC_DRAW);
}

class CubeRenderSGNode extends SGNode {

  render(context) {

    //setting the model view and projection matrix on shader
    //setUpModelViewMatrix(context.sceneMatrix, context.viewMatrix, context);

    var positionLocation = gl.getAttribLocation(context.shader, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false,0,0) ;
    gl.enableVertexAttribArray(positionLocation);

    var colorLocation = gl.getAttribLocation(context.shader, 'a_color');
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorBuffer);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false,0,0) ;
    gl.enableVertexAttribArray(colorLocation);

    gl.uniform1f(gl.getUniformLocation(context.shader, 'u_alpha'), 0.5);

    /*
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false,0,0) ;
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, metallTextur);
    gl.uniform1i(shaderProgram.samplerUniform, 0);
    */

    setTransformationUniforms(context);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
    gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0); //LINE_STRIP

    //render children
    super.render(context);
  }
}

class PyramidRenderSGNode extends SGNode {

  render(context) {

    //setting the model view and projection matrix on shader
    //setUpModelViewMatrix(context.sceneMatrix, context.viewMatrix, context);

    var positionLocation = gl.getAttribLocation(context.shader, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false,0,0) ;
    gl.enableVertexAttribArray(positionLocation);

    var colorLocation = gl.getAttribLocation(context.shader, 'a_color');
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramidColorBuffer);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false,0,0) ;
    gl.enableVertexAttribArray(colorLocation);

    gl.uniform1f(gl.getUniformLocation(context.shader, 'u_alpha'), 0.5);

    setTransformationUniforms(context);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramidIndexBuffer);
    gl.drawElements(gl.TRIANGLES, pyramidIndices.length, gl.UNSIGNED_SHORT, 0); //LINE_STRIP

    //render children
    super.render(context);
  }
}

class TriangularPrismRenderSGNode extends SGNode {
  render(context) {

    //setting the model view and projection matrix on shader
    //setUpModelViewMatrix(context.sceneMatrix, context.viewMatrix, context);

    var positionLocation = gl.getAttribLocation(context.shader, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, triangularPrismVertexBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false,0,0) ;
    gl.enableVertexAttribArray(positionLocation);

    var colorLocation = gl.getAttribLocation(context.shader, 'a_color');
    gl.bindBuffer(gl.ARRAY_BUFFER, triangularPrismColorBuffer);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false,0,0) ;
    gl.enableVertexAttribArray(colorLocation);

    gl.uniform1f(gl.getUniformLocation(context.shader, 'u_alpha'), 0.5);

    setTransformationUniforms(context);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangularPrismIndexBuffer);
    gl.drawElements(gl.TRIANGLES, triangularPrismIndices.length, gl.UNSIGNED_SHORT, 0); //LINE_STRIP

    //render children
    super.render(context);
  }
}

function setTransformationUniforms(context) {
  //set matrix uniforms
  const modelViewMatrix = mat4.multiply(mat4.create(), context.viewMatrix, context.sceneMatrix);
  const normalMatrix = mat3.normalFromMat4(mat3.create(), modelViewMatrix);
  const projectionMatrix = context.projectionMatrix;

  const gl = context.gl,
  shader = context.shader;
  gl.uniformMatrix4fv(gl.getUniformLocation(shader, 'u_modelView'), false, modelViewMatrix);
  gl.uniformMatrix3fv(gl.getUniformLocation(shader, 'u_normalMatrix'), false, normalMatrix);
  gl.uniformMatrix4fv(gl.getUniformLocation(shader, 'u_projection'), false, projectionMatrix);
}

function handleLoadedTexture(texture)
{
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.bindTexture(gl.TEXTURE_2D, null);
}

var metallTextur;

function initTexture()
{
    metallTextur = gl.createTexture();
    metallTextur.image = new Image();
    metallTextur.image.onload = function()
    {
      handleLoadedTexture(metallTextur)
    }
    metallTextur.image.src = "metallTextur.jpg";
}

function movePlane(time){
  var movement = time / 1000;
  var animatedAngle = time / 10;

  //animate based on elapsed time
  var planeMatrix = glm.transform({translate:[8*Math.sin(movement), 0, 8*Math.cos(movement)]});
  mat4.rotateY(planeMatrix, planeMatrix, movement+Math.PI);
  mat4.multiply(planeMatrix, planeMatrix, glm.rotateX(3*animatedAngle));
  plane.matrix = (planeMatrix);

  //animate based on elapsed time
  var propellerMatrix = mat4.multiply(mat4.create(), mat4.create(), glm.rotateX(12 * animatedAngle));
  propeller.matrix = (propellerMatrix);
}
