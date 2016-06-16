//the OpenGL context
'use strict';
var gl = null;

var root = null;
var surroundings = null;

const camera = {
  noclip : false,
  baseposition : {
    x : 0,
    y : 1,
    z : 4
  },
  addposition : {
    x : 0,
    y : 0,
    z : 0
  },
  baserotation : {
    x : 0,
    y : 0,
    z : -33
  },
  addrotation : {
    x : 0,
    y : 0,
    z : 0
  },
  move : function(x, z){

    camera.addposition.x += camera.getXDir() * x;
    camera.addposition.y += camera.getYDir() * y;
  },
  getXRad : function(){
    return (camera.baserotation.x + camera.addrotation.x) * Math.PI / 180;
  },
  getYRad : function(){
    return (camera.baserotation.y + camera.addrotation.y) * Math.PI / 180;;
  },
  getZRad : function(){
    return (camera.baserotation.z + camera.addrotation.z) * Math.PI / 180;
  },
  getXDir : function(){
    return 2 * Math.sin(camera.getXRad());
  },
  getYDir : function(){
    return 2 * Math.sin(camera.getYRad());
  },
  getZDir : function(){
    return 2 * Math.sin(camera.getZRad());
  },
  resetPosition : function(){
    camera.addposition.x = 0;
    camera.addposition.y = 0;
    camera.addposition.z = 0;
  },
  resetRotation : function(){
    camera.addrotation.x = 0;
    camera.addrotation.y = 0;
    camera.addrotation.z = 0;
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

  surroundings = createSurroundings(gl, resources);

  initInteraction(gl.canvas);
}

function render(timeInMilliseconds) {
  // checkForWindowResize(gl);

  gl.clearColor(0.5, 0.5, 0.5, 1.0);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.enable(gl.DEPTH_TEST);

  const context = createSGContext(gl);

  context.projectionMatrix = mat4.perspective(mat4.create(), Math.PI/6, gl.drawingBufferWidth / gl.drawingBufferHeight, .1, 100);
  var eye = [camera.baseposition.x + camera.addposition.x, camera.baseposition.y + camera.addposition.y, camera.baseposition.z + camera.addposition.z];
  context.viewMatrix = mat4.lookAt(mat4.create(),
  eye,
  [eye[0] + camera.getXDir(), eye[1], eye[2] + camera.getZDir()], [0,1,0]);
  context.invViewMatrix = mat4.invert(mat4.create(), context.viewMatrix);

  context.sceneMatrix = mat4.identity(mat4.create());

  root.render(context);

  var scene = Math.floor(timeInMilliseconds / 10000);
  if(surroundings[scene]){
    surroundings[scene].render(context);
  }

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

  tex1: 'textures/tex1.jpg',
  tex2: 'textures/tex2.jpg',
  tex3: 'textures/tex3.jpg',
  wave: 'textures/wave.jpg',
  alphamask: 'textures/alphamask_alt2.png',

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

  const root = new SGNode();

  {
    var width = 16;
    var height = 16;
    let floor = new MaterialSGNode(
                new TriTextureSGNode(resources.tex1, 512, resources.tex2, 256, resources.alphamask, 128,
                new RenderSGNode({
                  position: [-width, -height, 0,   width, -height, 0,   width, height, 0,   -width, height, 0],
                  normal: [0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1],
                  index: [0, 1, 2,   2, 3, 0]
                })));

    floor.ambient = [0, 0, 0, 1];
    floor.diffuse = [0.1, 0.1, 0.1, 1];
    floor.specular = [0.5, 0.5, 0.5, 1];
    floor.shininess = 50.0;

    root.append(new ShaderSGNode(createProgram(gl, resources.mt_vs, resources.mt_fs),
      new TransformationSGNode(glm.transform({ rotateX: 90, scale: 1}), [floor])
    ));
  }

  {
    root.append(new ShaderSGNode(createProgram(gl, resources.mod_vs, resources.mod_fs),
      new TransformationSGNode(glm.transform({ translate: [0, 0.5, 0], rotateX : 90, scale: 0.3 }),  [new RenderSGNode(resources.plane)])
    ));
  }

  return root;
}

function createSurroundings(gl, resources){

  const surroundings = [];

  surroundings[0] = new ShaderSGNode(createProgram(gl, resources.sb_vs, resources.sb_fs),
  new SkyboxSGNode(initSceneCube({
    env_r : resources.scene0_env_r,
    env_l : resources.scene0_env_l,
    env_d : resources.scene0_env_d,
    env_u : resources.scene0_env_u,
    env_f : resources.scene0_env_f,
    env_b : resources.scene0_env_b
  }, 3), 3, new RenderSGNode(makeSphere(10))));

  surroundings[1] = new ShaderSGNode(createProgram(gl, resources.sb_vs, resources.sb_fs),
  new SkyboxSGNode(initSceneCube({
    env_r : resources.scene1_env_r,
    env_l : resources.scene1_env_l,
    env_d : resources.scene1_env_d,
    env_u : resources.scene1_env_u,
    env_f : resources.scene1_env_f,
    env_b : resources.scene1_env_b
  }, 3), 3, new RenderSGNode(makeSphere(10))));

  surroundings[2] = new ShaderSGNode(createProgram(gl, resources.sb_vs, resources.sb_fs),
  new SkyboxSGNode(initSceneCube({
    env_r : resources.scene2_env_r,
    env_l : resources.scene2_env_l,
    env_d : resources.scene2_env_d,
    env_u : resources.scene2_env_u,
    env_f : resources.scene2_env_f,
    env_b : resources.scene2_env_b
  }, 3), 3, new RenderSGNode(makeSphere(10))));

  return surroundings;
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
  function limitDeg(deg){
    return Math.min(Math.max(deg, -90), 90);
  }
  canvas.addEventListener('mousedown', function(event) {
    mouse.pos = toPos(event);
    mouse.leftButtonDown = event.button === 0;
  });
  canvas.addEventListener('mousemove', function(event) {
    const pos = toPos(event);
    const delta = { x : mouse.pos.x - pos.x, z: mouse.pos.y - pos.y };
    if (mouse.leftButtonDown) {
  		camera.addrotation.x = limitDeg(camera.addrotation.x  + delta.x/16);
  		camera.addrotation.z = limitDeg(camera.addrotation.z  + delta.z/16);
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
        camera.move(0, -0.1);
        //camera.addposition.z-=.1;
      } else if (event.code === 'KeyS') {
        camera.move(0, 0.1);
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
