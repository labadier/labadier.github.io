import * as THREE from '../node_modules/three/build/three.module.js';
// import {GLTFLoader} from "./lib/GLTFLoader.module.js";
import {OBJLoader} from '../node_modules/three/examples/jsm/loaders/OBJLoader.js';
import {GLTFLoader} from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from '../node_modules/three/examples/jsm/utils/SkeletonUtils.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js'; 

// Variables estandara
let renderer, scene, camera, bicho, goal, keys, sky;
let mixers = [], clock, model, clips, isIdle, bicho_actions = {}
const lim = 2000
// Otras globales
var velocity = 0.0;
var speed = 0.0;

var dir = new THREE.Vector3;
var a = new THREE.Vector3;
var b = new THREE.Vector3;
var backwalk

// Acciones
init();
loadScene();
render();

export function addLighting(scene) {
  let color = 0xFFFFFF;
  let intensity = 1;
  let light = new THREE.DirectionalLight(color, intensity);
  light.position.set(110, 100, 110);
  light.target.position.set(-5, -2, -5);
  scene.add(light);
  scene.add(light.target);
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
    camera= new THREE.PerspectiveCamera(100,window.innerWidth/window.innerHeight,1,650);
    // camera.position.set(15, 15, 0);
    camera.position.set(5, 5, 0);
    
    camera.lookAt(0,1,0);
    
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

}


function createMaterialArray() {

  
  const skyboxImagepaths = ["ft", "bk", "up", "dn", "rt", "lf"].map(side => {
      return  "../images/skybox/sh_" + side + '.png';
  });

  const materialArray = skyboxImagepaths.map(image => {
    let texture = new THREE.TextureLoader().load(image);
    return new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  });
  
  return materialArray;
}

function loadScene()
{
    let floor_texture = new THREE.TextureLoader().load( 'images/suelo.jpg');
    floor_texture.wrapS = floor_texture.wrapT = THREE.RepeatWrapping;
    floor_texture.repeat.set(8*lim/100, 8*lim/100);
    floor_texture = new THREE.MeshBasicMaterial({map: floor_texture});
    // Suelo
    console.log(lim)
    const suelo = new THREE.Mesh( new THREE.PlaneGeometry(lim,lim), floor_texture );
    suelo.rotation.x = -Math.PI/2;
    scene.add(suelo);

    var skyGeo = new THREE.BoxGeometry(1200, 1200, 1200, 1, 1,1); 
    sky = new THREE.Mesh(skyGeo);
    const skyMaterial = createMaterialArray()
    sky.material = skyMaterial
    
    scene.add(sky);
    
    bicho = new THREE.Object3D();

    const loader = new GLTFLoader()
    loader.load( 'models/hare_animated/scene.gltf', function ( gltf ) {
        model = SkeletonUtils.clone(gltf.scene) ;
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
    scene.add( new THREE.AxesHelper(3) );
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
    isIdle ^= 1
  }
  
  velocity += ( speed - velocity ) * .3; 
  bicho.translateZ( velocity );
  
  if(velocity > 1e-3){    
    sky.position.setX(bicho.position.x)
    sky.position.setY(bicho.position.y)
    sky.position.setZ(bicho.position.z)
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
  goal.position.addScaledVector( dir, dis );
  
  camera.lookAt( bicho.position );

}

function update_animation(time){

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
