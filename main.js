//the OpenGL context
'use strict';

const width = 16;
const height = 16;

var gl = null;

var root = null;
var scenes = null;

const camera = {
  noclip : false,
  baseposition : vec3.fromValues(0,1,4),
  addposition : vec3.fromValues(0,0,0),
  baserotation : vec3.fromValues(0,0,0),
  addrotation : vec3.fromValues(0,0,0),
  move : function(x, z){
    var dir = camera.getDirVec();
    var xdir = vec3.scale(vec3.create(), dir, z);

    var zdir = vec3.rotateY(vec3.create(), dir, vec3.create(), Math.PI / 2);
    zdir[1] = 0;
    vec3.normalize(zdir, zdir);
    vec3.scale(zdir, zdir, x);

    vec3.add(camera.addposition, camera.addposition, xdir);
    vec3.add(camera.addposition, camera.addposition, zdir);

    camera.limitPosition();
  },
  getDirVec : function(){
    var dir = vec3.fromValues(0, 0, 1);
    var rad = camera.getRadians();
    vec3.rotateX(dir, dir, vec3.create(), rad[0]);
    vec3.rotateY(dir, dir, vec3.create(), rad[1]);
    vec3.rotateZ(dir, dir, vec3.create(), rad[2]);
    vec3.normalize(dir, dir);
    return dir;
  },
  getRadians : function(){
    var rad = [];
    var rotation = camera.getRotation();
    for (var i = 0; i < 3; i++) {
      rad[i] = camera.convertToRad(rotation[i]);
    }
    return rad;
  },
  convertToRad : function(rotation){
    return rotation * Math.PI / 180;
  },
  limitPosition : function(){
    var pos = camera.getPosition();
    if(pos[1] < 1){
      pos[1] += (1-pos[1]);
    }
    var len = vec3.length(pos);
    if(len > 14)
    {
      vec3.scale(pos, pos, 14 / len);
    }
    vec3.subtract(camera.addposition, pos, camera.baseposition);
  },
  getPosition : function(){
    return vec3.add(vec3.create(), camera.baseposition, camera.addposition);
  },
  getRotation : function(){
    return vec3.add(vec3.create(), camera.baserotation, camera.addrotation);
  },
  resetPosition : function(){
    camera.addposition = vec3.fromValues(0,0,0);
  },
  resetRotation : function(){
    camera.addrotation = vec3.fromValues(0,0,0);
  },
  reset : function(){
    camera.resetPosition();
    camera.resetRotation();
  }
};

function init(resources) {
  gl = createContext();

  gl.enable(gl.DEPTH_TEST);

  root = createSceneGraph(gl, resources);

  scenes = createScenes(gl, resources);

  initInteraction(gl.canvas);
}

function render(timeInMilliseconds) {
  // checkForWindowResize(gl);

  gl.clearColor(0, 0, 0, 1.0);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.enable(gl.DEPTH_TEST);

  const context = createSGContext(gl);

  context.projectionMatrix = mat4.perspective(mat4.create(), Math.PI * 30 /180, gl.drawingBufferWidth / gl.drawingBufferHeight, .1, 100);
  var eye = vec3.add(vec3.create(), camera.baseposition, camera.addposition);
  context.viewMatrix = mat4.lookAt(mat4.create(),
  eye, vec3.add(vec3.create(), eye, camera.getDirVec()), [0,1,0]);
  context.invViewMatrix = mat4.invert(mat4.create(), context.viewMatrix);

  context.sceneMatrix = mat4.identity(mat4.create());

  var scene = Math.floor(timeInMilliseconds / 1000);
  //var scene = Math.floor(timeInMilliseconds / 10000);
  if(scenes[scene % scenes.length]){
    scenes[scene % scenes.length].render(context);
  }
  root.render(context);

  requestAnimationFrame(render);
}

//load the shader resources using a utility function
loadResources({
  vs: 'shader/movie.vs.glsl',
  fs: 'shader/movie.fs.glsl',
  mt_vs: 'shader/multitexture.vs.glsl',
  mt_fs: 'shader/multitexture.fs.glsl',
  sb_vs: 'shader/skybox.vs.glsl',
  sb_fs: 'shader/skybox.fs.glsl',
  mod_vs: 'shader/model.vs.glsl',
  mod_fs: 'shader/model.fs.glsl',
  wt_vs: 'shader/water.vs.glsl',
  wt_fs: 'shader/water.fs.glsl',

  water: 'textures/black_water.jpg',
  tex1: 'textures/tex1.jpg',
  tex2: 'textures/tex2.jpg',
  tex3: 'textures/tex3.jpg',
  wave: 'textures/wave.jpg',
  alphamask: 'textures/alphamask.png',

  plane: 'models/plane.obj',

  scene0_env_r: 'skybox/TropicalSunnyDayRight.png',
  scene0_env_l: 'skybox/TropicalSunnyDayLeft.png',
  scene0_env_d: 'skybox/TropicalSunnyDayDown.png',
  scene0_env_u: 'skybox/TropicalSunnyDayUp.png',
  scene0_env_f: 'skybox/TropicalSunnyDayFront.png',
  scene0_env_b: 'skybox/TropicalSunnyDayBack.png',

  scene1_env_r: 'skybox/CloudyLightRaysRight.png',
  scene1_env_l: 'skybox/CloudyLightRaysLeft.png',
  scene1_env_d: 'skybox/CloudyLightRaysDown.png',
  scene1_env_u: 'skybox/CloudyLightRaysUp.png',
  scene1_env_f: 'skybox/CloudyLightRaysFront.png',
  scene1_env_b: 'skybox/CloudyLightRaysBack.png',

  scene2_env_r: 'skybox/DarkStormyRight.png',
  scene2_env_l: 'skybox/DarkStormyLeft.png',
  scene2_env_d: 'skybox/DarkStormyDown.png',
  scene2_env_u: 'skybox/DarkStormyUp.png',
  scene2_env_f: 'skybox/DarkStormyFront.png',
  scene2_env_b: 'skybox/DarkStormyBack.png'
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  init(resources);

  //render one frame
  render(0);
});

function createSceneGraph(gl, resources) {

  const root = new TransformationSGNode(glm.transform({ translate:[0, 0, 0]}));

  {
  }

  // {
  //   root.append(new ShaderSGNode(createProgram(gl, resources.mod_vs, resources.mod_fs),
  //     new TransformationSGNode(glm.transform({ translate: [0, 0.5, 0], rotateX : 90, scale: 0.3 }),  [new RenderSGNode(resources.plane)])
  //   ));
  // }

  return root;
}

function createScenes(gl, resources){

  const scenes = [];

  for (var i = 0; i < 3; i++) {
    scenes[i] = new SGNode();
  }

  {
    let floor = new MaterialSGNode(
      new TriTextureSGNode(resources.tex1, 512, resources.tex2, 256, resources.alphamask, 32,
        new RenderSGNode({
          position: [-width, -height, 0,   width, -height, 0,   width, height, 0,   -width, height, 0],
          normal: [0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1],
          index: [0, 1, 2,   2, 3, 0]
        })
      )
    );

    floor.ambient = [0, 0, 0, 1];
    floor.diffuse = [0.15, 0.15, 0.15, 1];
    floor.specular = [0.62, 0.62, 0.62, 1];
    floor.shininess = 50.0;

    let floorShader = new ShaderSGNode(createProgram(gl, resources.mt_vs, resources.mt_fs),
    new TransformationSGNode(glm.transform({ rotateX: 90}), floor));

    let texUnit = 3;
    {
      let skybox = new ShaderSGNode(createProgram(gl, resources.sb_vs, resources.sb_fs),
      new SkyboxSGNode(initSceneCube({
        env_r : resources.scene0_env_r,
        env_l : resources.scene0_env_l,
        env_d : resources.scene0_env_d,
        env_u : resources.scene0_env_u,
        env_f : resources.scene0_env_f,
        env_b : resources.scene0_env_b
      }, texUnit), texUnit, new RenderSGNode(makeSphere(16, 20, 90))));

      scenes[0].append(skybox);

      scenes[0].append(floorShader);
    }

    {
      let skybox = new ShaderSGNode(createProgram(gl, resources.sb_vs, resources.sb_fs),
      new SkyboxSGNode(initSceneCube({
        env_r : resources.scene1_env_r,
        env_l : resources.scene1_env_l,
        env_d : resources.scene1_env_d,
        env_u : resources.scene1_env_u,
        env_f : resources.scene1_env_f,
        env_b : resources.scene1_env_b
      }, texUnit), texUnit, new RenderSGNode(makeSphere(16, 20, 90))));

      scenes[1].append(skybox);

      scenes[1].append(floorShader);
    }

    {
      let sceneCube = initSceneCube({
        env_r : resources.scene2_env_r,
        env_l : resources.scene2_env_l,
        env_d : resources.scene2_env_d,
        env_u : resources.scene2_env_u,
        env_f : resources.scene2_env_f,
        env_b : resources.scene2_env_b
      }, texUnit);

      let skybox = new ShaderSGNode(createProgram(gl, resources.sb_vs, resources.sb_fs),
      new SkyboxSGNode(sceneCube, texUnit, new RenderSGNode(makeSphere(16, 20, 90))));

      scenes[2].append(skybox);

      scenes[2].append(new ShaderSGNode(createProgram(gl, resources.wt_vs, resources.wt_fs),
      new TransformationSGNode(glm.transform({ rotateX: 90 }),
      new SkyboxSGNode(sceneCube, texUnit, new RenderSGNode({
        position: [-width, -height, 0,   width, -height, 0,   width, height, 0,   -width, height, 0],
        normal: [0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1],
        index: [0, 1, 2,   2, 3, 0]
      })))));
    }
  }

  return scenes;
}

function initInteraction(canvas) {
  const mouse = {
    pos: { x : 0, y : 0},
    leftButtonDown: false
  };
  function toPos(event) {
    //convert to local coordinates
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }
  function limitDeg(deg = 0, limit = 90){
    return Math.min(Math.max(deg, -limit), limit);
  }
  canvas.addEventListener('mousedown', function(event) {
    mouse.pos = toPos(event);
    mouse.leftButtonDown = event.button === 0;
  });
  canvas.addEventListener('mousemove', function(event) {
    const pos = toPos(event);
    const delta = { yaw : mouse.pos.x - pos.x, pitch : mouse.pos.y - pos.y };
    if (mouse.leftButtonDown) {
      camera.addrotation[0] = (camera.addrotation[0]  + delta.yaw/16)%360;
      camera.addrotation[2] = limitDeg(camera.addrotation[2]  + delta.pitch/16, 90);
    }
    mouse.pos = pos;
  });
  canvas.addEventListener('mouseup', function(event) {
    mouse.pos = toPos(event);
    mouse.leftButtonDown = false;
  });
  document.addEventListener('keypress', function(event) {
    if(event.code === 'KeyC'){
      camera.noclip = !camera.noclip;
      if(!camera.noclip){
        camera.resetPosition();
      }
    } else if (event.code === 'KeyR') {
      camera.noclip = false;
      camera.reset();
    }
  });
  document.addEventListener('keydown', function(event) {
    if(camera.noclip){
      if (event.code === 'KeyW') {
        camera.move(0, 0.1);
        //camera.addposition.z-=.1;
      } else if (event.code === 'KeyS') {
        camera.move(0, -0.1);
        //camera.addposition.z+=.1;
      } else if (event.code === 'KeyA') {
        camera.move(0.1, 0);
        //camera.addposition.x-=.1;
      } else if (event.code === 'KeyD') {
        camera.move(-0.1, 0);
        //camera.addposition.x+=.1;
      }
    }
  });
}
