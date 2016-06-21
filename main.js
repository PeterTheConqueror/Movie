//the OpenGL context
'use strict';

var camera;

var scene;

const width = 48;
const height = 48;

var gl = null;

var scenes = null;
var planeroot = null;
var sunlight = null;
var spotlight = null;

const rise = 5000;
const crash = 15000;
const fall = 20000;

function init(resources) {
  gl = createContext(window.screen.availWidth * 0.99, window.screen.availHeight * 0.97);

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  gl.enable(gl.BLEND);

  gl.enable(gl.DEPTH_TEST);

  camera = new Camera();

  createSceneGraph(gl, resources);

  initInteraction(gl.canvas);
}

function render(time) {
  checkForWindowResize(gl);

  gl.clearColor(0, 0, 0, 1.0);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const context = createSGContext(gl);

  setScene(context, time);

  context.projectionMatrix = mat4.perspective(mat4.create(), Math.PI * 30 /180,
  (gl.canvas.width) / (gl.canvas.height),
  .1, 100);
  var eye = camera.getPosition();
  context.viewMatrix = mat4.lookAt(mat4.create(),
  eye, vec3.add(vec3.create(), eye, camera.getDirVec()), [0,1,0]);
  context.invViewMatrix = mat4.invert(mat4.create(), context.viewMatrix);

  context.sceneMatrix = mat4.identity(mat4.create());

  if(scenes[scene]){
    scenes[scene].render(context);
  }

  requestAnimationFrame(render);
}

function setScene(context, time) {
  // Sets the time for all TimeBasedTransformationSGNodes,
  // which can change their matrix according to this in the prerender function
  context.time = time;

  // Camera flight
  camera.moveCamera(time);

  // Calculate which scene should be shown
  //scene = Math.floor(context.time / 10000);
  scene = 2;
}

function createSceneGraph(gl, resources) {

  // Initialization of scene graph

  createLights(gl, resources);

  planeroot = setUpPlane(gl, resources);

  scenes = createScenes(gl, resources);
}

function createLights(gl, resources) {

  // Sun
  sunlight = new ExtendedLightSGNode(new Light([0, 45, 0], [0, 0, 0, 1], [1, 1, 1, 1], [1, 1, 1, 1]), 0);

  // Spotlight in front of plane
  spotlight = new SpotlightSGNode(new Light([0, 12, 0], [0, 0, 0, 1], [0.7, 0.7, 0.7, 1], [0.6, 0.6, 0.6, 1], [1, -1, 0], 15 * Math.PI / 180),1);

  // Set function so that spotlight moves correctly
  spotlight.prerender = context => spotlight.position = [0, (50 - (context.time / 1000 - 20) * 5), 0 ];
}

function createClouds(gl, resources) {
  const clouds = new TimeBasedTransformationSGNode();

  clouds.prerender = (context) => clouds.matrix = glm.translate(context.time/6000, 0, 0);

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
    clouds.append(new TransparentSGNode(glm.transform({translate: pos, scale: 3}), createGreyTone(1-i/1000, .4), new RenderSGNode(sphere)));
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
    // All skyboxes are stored in texture unit 3
    const texUnit = 3;

    // Shader for water surfaces (special effect animated wave movements)
    const waterShader = createProgram(gl, resources.wt_vs, resources.wt_fs);

    {
      const scene = scenes[0];

      // Add sun to skybox shader
      const skybox = new ShaderSGNode(createProgram(gl, resources.sb_vs, resources.sb_fs), sunlight);

      // Add the skybox node itself, each scene has own skybox
      skybox.append(new SkyboxSGNode(initSceneCube({
        env_r : resources.scene0_env_r,
        env_l : resources.scene0_env_l,
        env_d : resources.scene0_env_d,
        env_u : resources.scene0_env_u,
        env_f : resources.scene0_env_f,
        env_b : resources.scene0_env_b
      }, texUnit), texUnit, new RenderSGNode(makeSphere(48, 40, 90))));

      // Multitexturing is used here, also animated wave movements (but no mirroring of the skybox, which is in third scene)
      const water =  new MultiTextureSGNode(true, resources.alphamask, 32, resources.water_b1, 32, resources.water_b2, 16,
        new ShiftSGNode(new RenderSGNode({
          position: [-width, -height, 0,   width, -height, 0,   width, height, 0,   -width, height, 0],
          normal: [0, 0, -1,   0, 0, -1,   0, 0, -1,   0, 0, -1],
          index: [0, 1, 2,   2, 3, 0]
        }))
      );

      scene.append(skybox);
      scene.append(new ShaderSGNode(createProgram(gl, resources.mt_vs, resources.mt_fs),
      new TransformationSGNode(glm.transform({ rotateX: 90}), water)));
    }

    {
      // Transparency Node that makes sure opaque objects are rendered first, and then transparent objects ordered by camera distance (further away = earlier)
      const scene = new TransparencySGNode(waterShader
        , planeroot
      );

      // this cube is used for clouds and skybox (but hard to see in clouds)
      const sceneCube = initSceneCube({
        env_r : resources.scene1_env_r,
        env_l : resources.scene1_env_l,
        env_d : resources.scene1_env_d,
        env_u : resources.scene1_env_u,
        env_f : resources.scene1_env_f,
        env_b : resources.scene1_env_b
      }, texUnit);

      // Uses same shader and node as multitexturing, but only blends a lightning into the scene
      const lightning = new SGNode(new MultiTextureSGNode(false, resources.lightning_alpha, 1, resources.lightning, 32, null, null,
        new RenderSGNode({
          position: [-width, -height, 0,   width, -height, 0,   width, height, 0,   -width, height, 0],
          normal: [0, 0, -1,   0, 0, -1,   0, 0, -1,   0, 0, -1],
          index: [0, 1, 2,   2, 3, 0]
        })
      ));

      // Only render lightning for half a second, for this we override the parent SGNodes render method
      lightning.render = context => {
        if(Math.abs(context.time-crash)<250){
          lightning.children.forEach(c=>c.render(context));
        }
      };

      // Shader for lightning, same as multitexturing
      const lightningShader = new ShaderSGNode(createProgram(gl, resources.mt_vs, resources.mt_fs), lightning);

      const skybox = new ShaderSGNode(createProgram(gl, resources.sb_vs, resources.sb_fs),
      new SkyboxSGNode(sceneCube, texUnit, new RenderSGNode(makeSphere(48, 40, 90))));

      const shift = new ShiftSGNode(lightningShader);

      shift.append(createClouds(gl, resources));

      scene.append(new SkyboxSGNode(sceneCube, texUnit, new SetUniformSGNode('u_mirror', false, shift)));
      scene.appendOpaque(skybox);

      scenes[1] = scene;
    }

    {
      const scene = scenes[2];

      // this cube is used for water surface (mirroring) and skybox
      const sceneCube = initSceneCube({
        env_r : resources.scene2_env_r,
        env_l : resources.scene2_env_l,
        env_d : resources.scene2_env_d,
        env_u : resources.scene2_env_u,
        env_f : resources.scene2_env_f,
        env_b : resources.scene2_env_b
      }, texUnit);

      const skybox = new ShaderSGNode(createProgram(gl, resources.sb_vs, resources.sb_fs),
      new SkyboxSGNode(sceneCube, texUnit, new RenderSGNode(makeSphere(48, 40, 90))));

      const water = new SetUniformSGNode('u_mirror', true);
      const waterNode = new ShaderSGNode(waterShader, water);

      // Attach lights so that they are visible in scene
      water.append(sunlight);
      water.append(spotlight);

      // Special effect animated wave movements
      water.append(new ShiftSGNode(
        new TransformationSGNode(glm.transform({ rotateX: 90 }),
        new SkyboxSGNode(sceneCube, texUnit, new RenderSGNode({
          position: [-width, -height, 0,   width, -height, 0,   width, height, 0,   -width, height, 0],
          normal: [0, 0, -1,   0, 0, -1,   0, 0, -1,    0, 0, -1],
          index: [0, 1, 2,   2, 3, 0]
        })))
      ));

      scene.append(skybox);

      scene.append(waterNode);
    }
  }

  return scenes;
}

loadResources({
  mt_vs: 'shader/multitexture.vs.glsl',
  mt_fs: 'shader/multitexture.fs.glsl',
  sb_vs: 'shader/skybox.vs.glsl',
  sb_fs: 'shader/skybox.fs.glsl',
  wt_vs: 'shader/water.vs.glsl',
  wt_fs: 'shader/water.fs.glsl',
  pl_vs: 'shader/plane.vs.glsl',
  pl_fs: 'shader/plane.fs.glsl',

  water_b1: 'textures/water_bright_1.jpg',
  water_b2: 'textures/water_bright_2.jpg',
  lightning: 'textures/lightning.png',
  alphamask: 'textures/alphamask.png',
  lightning_alpha: 'textures/lightning_alpha.png',

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
}).then(function (resources) {
  init(resources);

  //render first frame
  render(0);
});


// Almost the same as in exercise
function initInteraction(canvas) {
  const mouse = {
    pos: { x : 0, y : 0},
    leftButtonDown: false
  };
  function toPos(event) {
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
      camera.rotate(delta.pitch, delta.yaw);
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
      } else if (event.code === 'KeyS') {
        camera.move(0, -1);
      } else if (event.code === 'KeyA') {
        camera.move(1, 0);
      } else if (event.code === 'KeyD') {
        camera.move(-1, 0);
      }
    }
  });
}
