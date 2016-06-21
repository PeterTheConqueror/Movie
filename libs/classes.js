class Camera {
  constructor(){
    this.noclip = false;
    this.baseposition = vec3.fromValues(0,4,-15);
    this.addposition = vec3.fromValues(0,0,0);
    this.baserotation = vec3.fromValues(5,0,0);
    this.addrotation = vec3.fromValues(0,0,0);
  }

  moveCamera(time){
    // Don't move camera if it is in user mode
    if(camera.noclip)
      return;

    if(time <= rise)
    {
      let ratio = time/rise;
      vec3.add(camera.baseposition, vec3.fromValues(0,4,-15), vec3.fromValues(2*ratio, -1.5 * ratio, -4 * ratio));
      vec3.add(camera.baserotation, vec3.fromValues(5,0,0), vec3.fromValues(0,-15*ratio,0));
    }else if(time > rise && time <= crash){
      let ratio = (time-rise)/crash;
      vec3.add(camera.baseposition, vec3.fromValues(0,4,-15), vec3.fromValues(2, -1.5, -4));
      vec3.add(camera.baseposition, camera.baseposition, vec3.fromValues(0, -3*ratio, -10*ratio));
      vec3.add(camera.baserotation, vec3.fromValues(5,0,0), vec3.fromValues(0,-15,0));
      vec3.add(camera.baserotation, camera.baserotation, vec3.fromValues(-20*ratio,15*ratio,0));
    } else if(time > crash && time <= fall){
      let ratio = (time-crash)/fall;
      vec3.add(camera.baseposition, vec3.fromValues(2, 0, -29), vec3.fromValues(0, 0, -4*ratio));
    } else if(time > fall){
      let ratio = (time-fall)/30000;
      vec3.add(camera.baserotation, vec3.fromValues(-25,0,0), vec3.fromValues(65*ratio,0,0));
    }
  }

  move(x, z){
    var dir = this.getDirVec();
    var xdir = vec3.scale(vec3.create(), dir, z);

    var zdir = vec3.rotateY(vec3.create(), dir, vec3.create(), Math.PI / 2);
    vec3.normalize(zdir, zdir);
    vec3.scale(zdir, zdir, x);

    var newAddPos = vec3.create();

    vec3.add(newAddPos, this.addposition, xdir);
    vec3.add(newAddPos, newAddPos, zdir);

    this.addposition = this.limitPosition(newAddPos);
  }

  rotate(pitch, yaw){
    this.addrotation[0] = this.limitXRotation(yaw/24);
    this.addrotation[1] = (this.addrotation[1]  - pitch/24)%360;
  }

  getDirVec(){
    var dir = vec3.fromValues(0, 0, 1);
    var rad = this.getRadians();
    vec3.rotateX(dir, dir, vec3.create(), rad[0]);
    vec3.rotateY(dir, dir, vec3.create(), rad[1]);
    vec3.rotateZ(dir, dir, vec3.create(), rad[2]);
    vec3.normalize(dir, dir);
    //console.log('x='+dir[0] + ' y='+dir[1]+ ' z='+dir[2]);
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

  // This makes sure the Camera stays where it should be
  limitPosition(newAddPos){
    var totalPos = vec3.create();
    vec3.add(totalPos, this.baseposition, newAddPos);
    var len = vec3.length(totalPos);

    // In scene 2 going below y==0 is allowed
    if(scene == 1){
      if(len > 46){
        vec3.scale(totalPos, totalPos, 46 / len);
      }
      return vec3.subtract(totalPos, totalPos, this.baseposition);
    }
    // In the other scenes it is not
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

  limitXRotation(yaw){
    var newRot = this.baserotation[0] + this.addrotation[0] + yaw;
    if(newRot > 89.9){
      newRot = 89.9;
    }
    if(newRot < -89.9){
      newRot = -89.9;
    }
    return newRot - this.baserotation[0];
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
  constructor(position, ambient, diffuse, specular, direction, angle)
  {
    this.position = position;
    this.ambient = ambient;
    this.diffuse = diffuse;
    this.specular = specular;
    this.direction = direction;
    this.angle = angle;
  }

  setParameters(lightNode, i){
    if(lightNode instanceof MyLightSGNode){
      lightNode.position = this.position;
      lightNode.ambient = this.ambient;
      lightNode.diffuse = this.diffuse;
      lightNode.specular = this.specular;
      lightNode.uniform += i != null ? i : '';
    }
    if(lightNode instanceof SpotlightSGNode && this.direction && this.angle){
      lightNode.direction = this.direction;
      lightNode.angle = this.angle;
    }
  }
}
