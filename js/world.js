import * as THREE from '../node_modules/three/build/three.module.js';
// import {GLTFLoader} from "./lib/GLTFLoader.module.js";
import {OBJLoader} from '../node_modules/three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import {Tweezers} from "./tweezers.js"

// Variables estandara
let renderer, scene, camera, controls;

// Otras globales
let robot;
let angulo = 0;


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
    camera.position.set(5, 5, 2);
    // camera.position.set(90, 300, 90);
    camera.lookAt(0,1,0);

    controls = new OrbitControls( camera, renderer.domElement );
    controls.listenToKeyEvents( window ); // optional

    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;

    controls.screenSpacePanning = false;

    controls.minDistance = 20;
    controls.maxDistance = 500;

    controls.maxPolarAngle = Math.PI / 2;

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
    
    const bicho = new THREE.Object3D();
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
    
    scene.add(bicho)
    scene.add( new THREE.AxesHelper(3) );

    var lookAtVector = new THREE.Vector3(0,0, -1);
    lookAtVector.applyQuaternion(camera.quaternion);
    lookAtVector.y = 4
    console.log(lookAtVector)
}

function update()
{
    angulo += 0.01;
    robot.rotation.y = angulo;

    var lookAtVector = new THREE.Vector3(0,0, -1);
    console.log()
    lookAtVector.applyQuaternion(camera.quaternion);
}

function render()
{
    requestAnimationFrame(render);
    // update();
    controls.update();
    renderer.render(scene,camera); 
}
