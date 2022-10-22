import * as THREE from '../node_modules/three/build/three.module.js';
// import {GLTFLoader} from "./lib/GLTFLoader.module.js";
import {OBJLoader} from '../node_modules/three/examples/jsm/loaders/OBJLoader.js';
import {GLTFLoader} from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from '../node_modules/three/examples/jsm/utils/SkeletonUtils.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js'; 


let renderer, scene, camera, bicho, goal, keys, sky, coins = [], asteroids = [];
let mixers = [], clock, clips, isIdle, bicho_actions = {}, trees = []
const amountreward = 150
const amounttrees = 60
const lim = 600, continouosFloor = new Array(3)

// Otras globales
let velocity = 0.0;
let speed = 0.0;
const visionrange = 500;
const generationrange = 800

let dir = new THREE.Vector3;
let a = new THREE.Vector3;
let b = new THREE.Vector3;
let backwalk, record = 0

// Acciones
init();
loadScene();
render();

function addLighting(scene) {
  let color = 0xFFFFFF;
  let intensity = 1;
  let light = new THREE.DirectionalLight(color, intensity);
  light.position.set(0, 400, 0);
  light.target.position.set(0, 0, 0);
  
  var ambiColor = "rgb(100, 100, 100 )";
  var ambientLight = new THREE.AmbientLight(ambiColor);

  scene.add(light);
  scene.add(light.target);
  scene.add(ambientLight)
}

function init()
{
    // Instanciar el motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth,window.innerHeight);  
    clock = new THREE.Clock();

    document.getElementById('container').appendChild( renderer.domElement );

    // Instanciar el nodo raiz de la escena
    scene = new THREE.Scene();
    // scene.background = new THREE.Color(0.5,0.5,0.5);
    addLighting(scene)

    // Instanciar la camara
    camera= new THREE.PerspectiveCamera(90 ,window.innerWidth/window.innerHeight,1,visionrange);
    camera.position.set(15, 15, 3);
    // camera.position.set(0, 60, 0);
    
    camera.lookAt(0,0,0);
    // camera.lookAt(0,20,0);
    
    backwalk = false
    goal = new THREE.Object3D;
    goal.position.z = -0.3;
    goal.add( camera );

    keys = {
      a: false,
      s: false,
      d: false,
      w: false
    };

    document.body.addEventListener( 'keydown', function(e) {
    
      var key = e.code.replace('Key', '').toLowerCase();
      if ( keys[ key ] !== undefined )
        keys[ key ] = true;
      
    });
    document.body.addEventListener( 'keyup', function(e) {
      
      var key = e.code.replace('Key', '').toLowerCase();
      if ( keys[ key ] !== undefined )
        keys[ key ] = false;
      
    });
  
  window.addEventListener('resize', updateAspectRatio );
}


function createMaterialArray() {

  const skyboxImagepaths = ["ft", "bk", "up", "dn", "rt", "lf"].map(side => {
      return  "images/skybox/sh_" + side + '.png';
  });

  const materialArray = skyboxImagepaths.map(image => {
    let texture = new THREE.TextureLoader().load(image);
    return new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  });
  
  return materialArray;
}

function createContinuousFloor(){


  let floor_texture = new THREE.TextureLoader().load( 'images/suelo.jpg');
  floor_texture.wrapS = floor_texture.wrapT = THREE.RepeatWrapping;
  floor_texture.repeat.set(8*lim/100, 8*lim/100);
  floor_texture = new THREE.MeshBasicMaterial({map: floor_texture});
  
  console.log(lim)

  for(var i = 0; i < 3; i ++)
    continouosFloor[i] = new Array(3)

  continouosFloor[1][1] = new THREE.Mesh( new THREE.PlaneGeometry(lim,lim), floor_texture );
  continouosFloor[1][1].rotation.x = -Math.PI/2;
  scene.add(continouosFloor[1][1]);
  
  const mf = [-1, -1, -1, 0, 0, 1, 1, 1]
  const mc = [-1, 0, 1, -1, 1, -1, 0, 1]

  // const clsr  = ['yellow', 'yellow', 'red', 'green', 'blue', 'skyblue', 'red', 'green', 'blue', 'yellow', 'red', 'green', 'blue']

  for(var i = 0; i < mf.length; i++){

    const nf = 1 + mf[i];
    const nc = 1 + mc[i];
    // const material = new THREE.MeshBasicMaterial({color:clsr[i],wireframe:true});
    continouosFloor[nf][nc] = continouosFloor[1][1].clone()
    continouosFloor[nf][nc].position.x = -lim*mf[i]
    continouosFloor[nf][nc].position.z = lim*mc[i]
    // if(nf != nc)
    //   continouosFloor[nf][nc].material = material
    
    scene.add(continouosFloor[nf][nc])
  } 
  console.log(continouosFloor)
}

function getNewRewardPosition ( x, z){

  let nx, nz  
  [nx, nz] = [x, z]

  const radius = 3
  while (nx < x + radius && nx > x - radius && nz < z + radius && nz > z - radius){
    nx = x + generationrange - Math.floor(Math.random() * generationrange * 2);
    nz = z + generationrange - Math.floor(Math.random() * generationrange * 2);
  }
  
  return [nx, nz]
}

function relocateTreePosition ( x, z ){

  let nx, nz  

  
  let angle = Math.PI*2*Math.random()
  let distance = visionrange + Math.random()*(generationrange - visionrange )

  nx = distance*Math.sin(angle)
  nz = distance*Math.cos(angle)

  console.log(distance)
  return [x + nx, z + nz]
}

function createRewards ( ){

  let model;
  const loader = new GLTFLoader()
    loader.load( 'models/carrot/scene.gltf', function ( gltf ) {

        model = gltf.scene

        model.scale.set(4,4, 4);
        model.rotateZ(-Math.PI/9)

        let pos
        for(var i = 0; i < amountreward; i++){
          
          coins.push(model.clone())
          pos = getNewRewardPosition(0, 0)
          coins[i].position.set(pos[0], 2, pos[1])
          scene.add(coins[i])
        }
                      
      }, undefined, function(error) {
        console.error(error);
    });
}


function createTrees ( ){

  let model, pos
  const sizes = [ 0.1] //4
  const models = ['pine_tree']

  for(let i = 0; i < models.length; i++){
    
    const loader = new GLTFLoader()
    loader.load( 'models/' + models[i] + '/scene.gltf', function ( gltf ) {

        model = gltf.scene
        model.scale.set(sizes[i], sizes[i], sizes[i]);
                
        for(var j = 0; j < amounttrees; j++){

          trees.push(model.clone())
          pos = getNewRewardPosition(0, 0)
          trees[trees.length - 1].position.set(pos[0], 0, pos[1])
          scene.add(trees[trees.length - 1])
        }
                      
      }, undefined, function(error) {
        console.error(error);
    });
  }  
}

function createAgent( ){

  bicho = new THREE.Object3D();

    const loader = new GLTFLoader()
    loader.load( 'models/hare_animated/scene.gltf', function ( gltf ) {
      const model = SkeletonUtils.clone(gltf.scene) ;

      const mixer = new THREE.AnimationMixer(model);
      clips = gltf.animations;
      
      const clip = THREE.AnimationClip.findByName(clips, 'Armature|Idle  ');
      const action = mixer.clipAction(clip);
      bicho_actions['Armature|Idle  '] = action
      action.play();
      mixers.push(mixer);
      bicho.add(model)

    }, undefined, function(error) {
      console.error(error);
  });
  
  isIdle = true
  bicho.rotateY(-Math.PI/2)
  scene.add(bicho)
}


function loadScene()
{
    
    createContinuousFloor()

    var skyGeo = new THREE.BoxGeometry(800, 800, 800, 1, 1,1); 
    sky = new THREE.Mesh(skyGeo);
    const skyMaterial = createMaterialArray()
    sky.material = skyMaterial
    scene.add(sky);


    createAgent( );
    createTrees( );
    console.log(trees)
    
    scene.add( new THREE.AxesHelper(3) );

    createRewards ( )
}
 
function checkCenter(){

/// swap 9x9 matrix of continuous floe
 
  // check movement towards upper row
  if (bicho.position.x > continouosFloor[1][1].position.x + (lim>>1) ){
    
    //update position of lower row
    for(var i = 0; i < 3; i++)
      continouosFloor[2][i].position.x = continouosFloor[0][i].position.x + lim
    //swap rows to mantain 9x9 matrix intuition

    for(var i = 2; i > 0; i --)
    [continouosFloor[i], continouosFloor[i-1]] = [continouosFloor[i-1], continouosFloor[i]]
    console.log('ur')
  }

  // check movement towards lower row
  if (bicho.position.x < continouosFloor[1][1].position.x - (lim>>1) ){
    
    //update position of lower row
    for(var i = 0; i < 3; i++)
      continouosFloor[0][i].position.x = continouosFloor[2][i].position.x - lim
    //swap rows to mantain 9x9 matrix intuition

    for(var i = 0; i < 2; i ++)
    [continouosFloor[i], continouosFloor[i+1]] = [continouosFloor[i+1], continouosFloor[i]]
    console.log('lr')
  }

  // check movement towards right column
  if (bicho.position.z > continouosFloor[1][1].position.z + (lim>>1) ){
    
    //update position of lower row
    for(var i = 0; i < 3; i++)
      continouosFloor[i][0].position.z = continouosFloor[i][2].position.z + lim
    
      //swap rows to mantain 9x9 matrix intuition
    for(var i = 0; i < continouosFloor.length; i++)
      for(var j = 0; j < 2; j ++)
        [continouosFloor[i][j], continouosFloor[i][j+1]] = [continouosFloor[i][j+1], continouosFloor[i][j]]
    console.log('rc')
  }

  // check movement towards left column
  if (bicho.position.z < continouosFloor[1][1].position.z - (lim>>1) ){

    console.log(bicho.position.z, continouosFloor[1][1].position.z)
    
    //update position of lower row
    for(var i = 0; i < 3; i++)
      continouosFloor[i][2].position.z = continouosFloor[i][0].position.z - lim
    
      //swap rows to mantain 9x9 matrix intuition
    for(var i = 0; i < continouosFloor.length; i++)
      for(var j = 2; j > 0; j --)
        [continouosFloor[i][j], continouosFloor[i][j-1]] = [continouosFloor[i][j-1], continouosFloor[i][j]]
    console.log('lc')
  }
}

function checkCarrotInteraction (){

  const close_radius = 2
  
  for(var i = 0; i < coins.length; i++)
    if(Math.hypot(bicho.position.x - coins[i].position.x, bicho.position.z - coins[i].position.z)  < close_radius){

      const pos = getNewRewardPosition(bicho.position.x, bicho.position.z)
      coins[i].position.set(pos[0], 2, pos[1])
      record ++;
      console.log(record)
    }
}

function updateObjectsPosition (){

  for(var i = 0; i < coins.length; i++)
    if(Math.hypot(bicho.position.x - coins[i].position.x, bicho.position.z - coins[i].position.z)  > visionrange){
      const pos = getNewRewardPosition(bicho.position.x, bicho.position.z)
      coins[i].position.set(pos[0], 0, pos[1])
    }

  for(var i = 0; i < trees.length; i++)
    if(Math.hypot(bicho.position.x - trees[i].position.x, bicho.position.z - trees[i].position.z)  > generationrange){
      const pos = relocateTreePosition(bicho.position.x, bicho.position.z)
      trees[i].position.set(pos[0], 0, pos[1])
    }

}

function update(){ 

  speed = 0.0;
  
  if ( keys.w ){

    if(backwalk){
      bicho.rotateY(Math.PI)
      backwalk ^= 1
    }
    speed = 0.07;
  }
  else if ( keys.s ){

    if(!backwalk){
      bicho.rotateY(Math.PI)
      backwalk ^= 1
    }
    speed = 0.04;
  }

  if(velocity > 1e-3 && isIdle){ 
    
    const clip = THREE.AnimationClip.findByName(clips, 'Armature|run ');
    mixers[0].stopAllAction()
    const action = mixers[0].clipAction(clip);
    action.clampWhenFinished = true;
    action.play(); 
    isIdle ^= 1
  }
  else if(!isIdle && velocity <= 1e-3){
    
    const clip = THREE.AnimationClip.findByName(clips, 'Armature|Idle  ');
    mixers[0].stopAllAction()
    const action = mixers[0].clipAction(clip);
    action.play();  
    console.log(bicho.position)
    isIdle ^= 1
  }
  
  velocity += ( speed - velocity ) * .3; 
  bicho.translateZ( velocity );
  
  if(velocity > 1e-3){    

    checkCarrotInteraction();
    updateObjectsPosition();
    sky.position.setX(bicho.position.x)
    sky.position.setY(bicho.position.y)
    sky.position.setZ(bicho.position.z)

    checkCenter();
  }

  if ( keys.a ){
    bicho.rotateY(0.03);
    goal.rotateY(0.03)
  }
  else if ( keys.d ){
    bicho.rotateY(-0.03);
    goal.rotateY(-0.03);
  }

    
  a.lerp(bicho.position, 0.4);
  b.copy(goal.position);
    
  dir.copy( a ).sub( b ).normalize();
  const dis = a.distanceTo( b ) - 0.3;
  goal.position.addScaledVector( dir, dis  );
  
  camera.lookAt( bicho.position );

}

function updateAspectRatio()
{
  renderer.setSize(window.innerWidth,window.innerHeight);

  const ar = window.innerWidth/window.innerHeight;
  camera.aspect = ar;
  camera.updateProjectionMatrix();

}

function update_animation(time){

  for(var i = 0; i < coins.length; i++)
    coins[i].rotation.y += 0.01

  const delta = clock.getDelta();
  mixers.forEach(function(mixer) {
      mixer.update(delta);
  });
  renderer.render(scene, camera);
}

function render()
{
    requestAnimationFrame(render);
    update();
    update_animation();
    
    renderer.render(scene,camera); 
}
