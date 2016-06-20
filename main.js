//the OpenGL context
'use strict';

var camera;

var scene;

const width = 48;
const height = 48;

var gl = null;

var root = null;
var scenes = null;
var clouds = null;
var lights = null;
var planeroot = null;

var plane;
var propeller;

function init(resources) {
  gl = createContext();

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  gl.enable(gl.BLEND);

  gl.enable(gl.DEPTH_TEST);

  // Enable backface culling so that only one the front side of clouds is visible
  // gl.enable(gl.CULL_FACE)
  //
  // gl.cullFace(gl.BACK);

  camera = new Camera();

  createSceneGraph(gl, resources);

  initInteraction(gl.canvas);
}

function render(time) {
  // checkForWindowResize(gl);

  gl.clearColor(0, 0, 0, 1.0);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const context = createSGContext(gl);

  context.projectionMatrix = mat4.perspective(mat4.create(), Math.PI * 30 /180, gl.drawingBufferWidth / gl.drawingBufferHeight, .1, 100);
  var eye = vec3.add(vec3.create(), camera.baseposition, camera.addposition);
  context.viewMatrix = mat4.lookAt(mat4.create(),
  eye, vec3.add(vec3.create(), eye, camera.getDirVec()), [0,1,0]);
  context.invViewMatrix = mat4.invert(mat4.create(), context.viewMatrix);

  context.sceneMatrix = mat4.identity(mat4.create());

  calcScene(context, time);

  root.render(context);

  if(scenes[scene % scenes.length]){
    scenes[scene % scenes.length].render(context);
  }

  requestAnimationFrame(render);
}

function LIGHTNING(){

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function calcScene(context, time) {

  context.shift = (time/6000);

  clouds.matrix = glm.translate(context.shift, 0, 0);

  movePlane(time);

  var prevScene = scene;

  //scene = 1;
  //scene = Math.floor(time / 1000);
  scene = Math.floor(time / 5000);
  //scene = Math.floor(time / 10000);

  // Reset Camera if scene changes
  if(prevScene != scene)
  {
    camera.baseposition = vec3.fromValues(0,4,-25);
  }
  return scene;
}

function createSceneGraph(gl, resources) {

  planeroot = setUpPlane(gl, resources);

  lights = createLights(gl, resources);

  scenes = createScenes(gl, resources);

  root = new TransformationSGNode(glm.transform({ translate:[0, 0, 0]}));
}

function createLights(gl, resources) {

  const lights = [];

  // Sun
  lights[0] = new Light([0, 45, 0], [0, 0, 0, 1], [1, 1, 1, 1], [1, 1, 1, 1]);

  // Spotlight attached to plane
  lights[1] = new Light([0, 0, 0], [0, 0, 0, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, -1, 0], 30 * Math.PI / 180);

  // lights[2] = new Light([-4, 7, 4], [0, 0, 0, 1], [1, 1, 1, 1], [1, 1, 1, 1]);
  // lights[3] = new Light([4, 7, 4], [0, 0, 0, 1], [1, 1, 1, 1], [1, 1, 1, 1]);

  return lights;
}

function createClouds(gl, resources) {
  clouds = new TransformationSGNode();

  // Cloud generation, supposed to look random but is actually completely deterministic
  for (var i = 0; i < 500; i++) {
    let x = Math.cos(-i - i*i - i*i*i);
    let y = Math.sin((i+2) * (i+1) * i);
    let z = Math.sin((i-51)*(i-52)*(i-53)*(i-54)*(i-55));
    let pos = vec3.fromValues(x, y,z);
    let len = vec3.length(pos);

    //Make sure clouds are distributed nicely across the visible scene
    vec3.scale(pos, pos, ((i < 200 ? i : 200)+25)/225*45/len);
    let sphere = makeSphere(0.5, 55, 55);

    //Add clouds
    clouds.append(new TransparentSGNode(glm.transform({translate: pos, scale: 3}), createGreyTone(1-(i+500)/1000, .6), new RenderSGNode(sphere)));
  }

  return clouds;
}

function createScenes(gl, resources){

  const scenes = [];

  for (var i = 0; i < 3; i++) {
    scenes[i] = new SGNode();
    scenes[i].append(planeroot);
  }

  {
    let texUnit = 3;
    let waterShader = createProgram(gl, resources.wt_vs, resources.wt_fs);

    {
      let scene = scenes[0];

      let skybox = new ShaderSGNode(createProgram(gl, resources.sb_vs, resources.sb_fs),
      new SkyboxSGNode(initSceneCube({
        env_r : resources.scene0_env_r,
        env_l : resources.scene0_env_l,
        env_d : resources.scene0_env_d,
        env_u : resources.scene0_env_u,
        env_f : resources.scene0_env_f,
        env_b : resources.scene0_env_b
      }, texUnit), texUnit, new RenderSGNode(makeSphere(48, 40, 90))));

      let water = new MaterialSGNode(
        new TriTextureSGNode(resources.water_b1, 32, resources.water_b2, 16, resources.alphamask, 32,
          new ShiftSGNode(new RenderSGNode({
            position: [-width, -height, 0,   width, -height, 0,   width, height, 0,   -width, height, 0],
            normal: [0, 0, -1,   0, 0, -1,   0, 0, -1,   0, 0, -1],
            index: [0, 1, 2,   2, 3, 0]
          }))
        )
      );

      water.ambient = [0, 0, 0, 1];
      water.diffuse = [0.15, 0.15, 0.15, 1];
      water.specular = [0.62, 0.62, 0.62, 1];
      water.shininess = 50.0;

      scene.append(skybox);
      scene.append(new ShaderSGNode(createProgram(gl, resources.mt_vs, resources.mt_fs),
      new TransformationSGNode(glm.transform({ rotateX: 90}), water)));
    }

    {
      let scene = new TransparencySGNode(waterShader
        , planeroot
      );

      let sceneCube = initSceneCube({
        env_r : resources.scene1_env_r,
        env_l : resources.scene1_env_l,
        env_d : resources.scene1_env_d,
        env_u : resources.scene1_env_u,
        env_f : resources.scene1_env_f,
        env_b : resources.scene1_env_b
      }, texUnit);

      let skybox = new ShaderSGNode(createProgram(gl, resources.sb_vs, resources.sb_fs),
      new SkyboxSGNode(sceneCube, texUnit, new RenderSGNode(makeSphere(48, 40, 90))));

      scene.append(new SkyboxSGNode(sceneCube, texUnit, new SetUniformSGNode('u_useCube', false, new ShiftSGNode(createClouds(gl, resources)))));
      scene.appendOpaque(skybox);

      scenes[1] = scene;
    }

    {
      let scene = scenes[2];

      let sceneCube = initSceneCube({
        env_r : resources.scene2_env_r,
        env_l : resources.scene2_env_l,
        env_d : resources.scene2_env_d,
        env_u : resources.scene2_env_u,
        env_f : resources.scene2_env_f,
        env_b : resources.scene2_env_b
      }, texUnit);

      let skybox = new ShaderSGNode(createProgram(gl, resources.sb_vs, resources.sb_fs),
      new SkyboxSGNode(sceneCube, texUnit, new RenderSGNode(makeSphere(48, 40, 90))));

      let water = new ShaderSGNode(waterShader,
        new SetUniformSGNode('u_useCube', true,
        new MultiLightSGNode(lights,
          new ShiftSGNode(
            new TransformationSGNode(glm.transform({ rotateX: 90 }),
            new SkyboxSGNode(sceneCube, texUnit, new RenderSGNode({
              position: [-width, -height, 0,   width, -height, 0,   width, height, 0,   -width, height, 0],
              normal: [0, 0, -1,   0, 0, -1,   0, 0, -1,    0, 0, -1],
              index: [0, 1, 2,   2, 3, 0]
            })))
          )
        ))
      );

      scene.append(skybox);

      scene.append(water);
    }
  }

  return scenes;
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
  vs_single: 'shader/simple.vs.glsl',
  fs_single: 'shader/simple.fs.glsl',

  water_b: 'textures/water_black.jpg',
  water_b1: 'textures/water_bright_1.jpg',
  water_b2: 'textures/water_bright_2.jpg',
  water_b3: 'textures/water_bright_3.jpg',
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
  scene2_env_b: 'skybox/DarkStormyBack.png',
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  init(resources);

  //render one frame
  render(0);
});

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
    const delta = { pitch : mouse.pos.x - pos.x, yaw : mouse.pos.y - pos.y };
    if (mouse.leftButtonDown) {
      //camera.rotate(delta);
      camera.addrotation[0] = (camera.addrotation[0]  + delta.yaw/24)%360;
      camera.addrotation[1] = (camera.addrotation[1]  - delta.pitch/24)%360;
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
        camera.move(0, 1);
        //camera.addposition.z-=.1;
      } else if (event.code === 'KeyS') {
        camera.move(0, -1);
        //camera.addposition.z+=.1;
      } else if (event.code === 'KeyA') {
        camera.move(1, 0);
        //camera.addposition.x-=.1;
      } else if (event.code === 'KeyD') {
        camera.move(-1, 0);
        //camera.addposition.x+=.1;
      }
    }
  });
}
