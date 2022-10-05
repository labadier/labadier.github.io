import * as THREE from '../node_modules/three/build/three.module.js';
// import {GLTFLoader} from "./lib/GLTFLoader.module.js";
import {OBJLoader} from '../node_modules/three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js'; 

// Variables estandara
let renderer, scene, camera, controls, bicho, goal, keys;

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
    document.getElementById('container').appendChild( renderer.domElement );

    // Instanciar el nodo raiz de la escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.5,0.5,0.5);
    addLighting(scene)

    // Instanciar la camara
    camera= new THREE.PerspectiveCamera(100,window.innerWidth/window.innerHeight,1,600);
    camera.position.set(15, 15, 0);
    
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

function loadScene()
{
    let floor_texture = new THREE.TextureLoader().load( 'images/suelo.jpg');
    floor_texture.wrapS = floor_texture.wrapT = THREE.RepeatWrapping;
    floor_texture.repeat.set(80, 80);
    floor_texture = new THREE.MeshBasicMaterial({map: floor_texture});

    // Suelo
    const suelo = new THREE.Mesh( new THREE.PlaneGeometry(1000,1000), floor_texture );
    suelo.rotation.x = -Math.PI/2;
    scene.add(suelo);
    
    bicho = new THREE.Object3D();
    const loader = new OBJLoader();
    loader.load('models/strawberry/Strawberry.obj', 
    function (objeto)
    {        
        var texture = new THREE.TextureLoader().load('models/strawberry/Strawberry-Color.png');

        objeto.traverse(function (child) {   // aka setTexture
          if ( child.isMesh ) {
              child.material.map = texture;
              child.geometry.computeVertexNormals();
          }
      });
      bicho.add(objeto); 
    });
    
    bicho.rotateY(-Math.PI/2)
    scene.add(bicho)
    scene.add( new THREE.AxesHelper(3) );
    console.log(bicho.position, camera.position)

}
 

function update()
{
  console.log(camera.position)

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
  
  velocity += ( speed - velocity ) * .3;
  console.log(velocity, speed)
  bicho.translateZ( velocity );

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

function render()
{
    requestAnimationFrame(render);
    update();
    
    renderer.render(scene,camera); 
}
