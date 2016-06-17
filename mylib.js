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
