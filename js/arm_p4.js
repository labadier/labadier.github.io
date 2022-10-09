import * as THREE from "../lib/three.module.js";
import {GLTFLoader} from "../lib/GLTFLoader.module.js";
import {OrbitControls} from "../lib/OrbitControls.module.js"
import {Tweezers} from "./tweezers.js"
import {GUI} from "../lib/lil-gui.module.min.js";
import {TWEEN} from "../lib/tween.module.min.js";

// Variables estandara
let renderer, scene, camera, controls, minicam, metal_material = [];
let effectController, forearm, hand, tweezer0, tweezer1;
let actualMaterial=0;

// Otras globales
let robot, arm;
const L = 60;
let angulo = 0, tween;

// Acciones
init();
loadScene();
setupGUI();
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

function set_cameras(){

  const ar = window.innerWidth/window.innerHeight

  minicam  = new THREE.OrthographicCamera(-L*ar,L*ar,L,-L,0,350);
  minicam.position.set(0,300,0);
  minicam.lookAt(0,0,0);

  // Instanciar la camara
  camera= new THREE.PerspectiveCamera(100,window.innerWidth/window.innerHeight,1,600);

  camera.position.set(90, 300, 90);
  // camera.position.set(20, 50, 10);
  camera.lookAt(0,1,0);

}


function init()
{
    // Instanciar el motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.setClearColor(new THREE.Color(0.7,0.7,0.7));
    renderer.autoClear = false;

    document.getElementById('container').appendChild( renderer.domElement );

    // Instanciar el nodo raiz de la escena
    scene = new THREE.Scene();
    
    addLighting(scene)

    set_cameras();
    

    controls = new OrbitControls( camera, renderer.domElement );
    controls.listenToKeyEvents( window ); // optional

    controls.enableDamping = true; 
    controls.dampingFactor = 0.05;

    // controls.minDistance = 300;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2;

    window.addEventListener('resize', updateAspectRatio );

}

function loadScene()
{
    metal_material.push(new THREE.MeshPhongMaterial({color:'blue', shininess: 100, }));
    metal_material.push(new THREE.MeshPhongMaterial({color:'blue',wireframe:true}));
    
    let floor_texture = new THREE.TextureLoader().load( 'images/suelo.jpg');
    floor_texture.wrapS = floor_texture.wrapT = THREE.RepeatWrapping;
    floor_texture.repeat.set(80, 80);
    floor_texture = new THREE.MeshBasicMaterial({map: floor_texture});

    // Suelo
    const suelo = new THREE.Mesh( new THREE.PlaneGeometry(1000,1000), floor_texture );
    suelo.rotation.x = -Math.PI/2;
    scene.add(suelo);

    // base
    const base = new THREE.Mesh( new THREE.CylinderGeometry(50, 50, 15, 100), metal_material[0] );

    // arm
    const arm_soulder = new THREE.Mesh( new THREE.CylinderGeometry(20, 20, 15, 100), metal_material[0] );
    arm_soulder.rotation.set(0, Math.PI/2, Math.PI/2) 

    const arm_humero = new THREE.Mesh( new THREE.BoxGeometry(18, 120, 12), metal_material[0] );
    const arm_elbow = new THREE.Mesh( new THREE.SphereGeometry(20, 20, 20), metal_material[0] );

    arm_humero.position.set(0, 60, 0)
    arm_elbow.position.set(0, 60*2, 0)
    
    arm = new THREE.Object3D();
    arm.add(arm_soulder);
    arm.add(arm_humero);
    arm.add(arm_elbow);

    //forearm
    const arm_elbow2 = new THREE.Mesh( new THREE.CylinderGeometry(22, 22, 6, 100), metal_material[0] );
    const nerve_0 = new THREE.Mesh( new THREE.BoxGeometry(4, 80, 4), metal_material[0] );
    const nerve_1 = new THREE.Mesh( new THREE.BoxGeometry(4, 80, 4), metal_material[0] );
    const nerve_2 = new THREE.Mesh( new THREE.BoxGeometry(4, 80, 4), metal_material[0] );
    const nerve_3 = new THREE.Mesh( new THREE.BoxGeometry(4, 80, 4), metal_material[0] );

    nerve_0.position.set(22*0.5, 40+3, 22*0.5)
    nerve_1.position.set(-22*0.5, 40+3, 22*0.5)
    nerve_2.position.set(22*0.5, 40+3, -22*0.5)
    nerve_3.position.set(-22*0.5, 40+3, -22*0.5)
    
    
    forearm = new THREE.Object3D();
    forearm.add(arm_elbow2);
    forearm.add(nerve_0);
    forearm.add(nerve_1 );
    forearm.add(nerve_2);
    forearm.add(nerve_3);

    //hand
    const wrist = new THREE.Mesh( new THREE.CylinderGeometry(15, 15, 40, 100), metal_material[0] );
    wrist.rotation.x = Math.PI/2

    // tweezers   
    tweezer0 = new Tweezers(metal_material[0])
    tweezer0.position.set(15, 0, 10)

    tweezer1 = tweezer0.clone()
    tweezer1.position.set(15, 0, -10)
    

    hand = new THREE.Object3D();
    hand.add(wrist);
    hand.add(tweezer0);
    hand.add(tweezer1);
    hand.position.y = 80

    forearm.add(hand)
    forearm.position.y = 60*2
    arm.add(forearm)
    arm.position.y = 8.5

    robot = new THREE.Object3D();
    robot.add(base);
    robot.add(arm);
    robot.position.y = 7.8;
    // robot.scale.set(0.1,.1, .1)

    scene.add(robot);

    scene.add( new THREE.AxesHelper(3) );
}

function updateAspectRatio()
{
    // Cambia las dimensiones del canvas
    renderer.setSize(window.innerWidth,window.innerHeight);

    // Nuevo relacion aspecto de la camara
    const ar = window.innerWidth/window.innerHeight;

    // perspectiva
    camera.aspect = ar;
    camera.updateProjectionMatrix();
}

function updateMaterial(node){

  if(!node.children.length){
    node.material = metal_material[actualMaterial]
    return;
  }

  for(var i = 0; i < node.children.length; i++)
    updateMaterial(node.children[i])

}

function autoAnimate(){

  tween.start()
  console.log(tween, 'hoola')
}


function setupGUI()
{
	// Definicion de los controles
	effectController = {
		giroBase: 0.0,
    giroBrazo: 0.0,
    giroAntebrazoY: 0.0,
    giroAntebrazoZ: 0.0,
    giroPinzas: 0.0,
    separacionPinza: 10.0,
    alambre: false,
    animate: autoAnimate
    
	};

  //setupAnimation
  tween = new TWEEN.Tween(effectController)
	.to({giroBrazo:[-45, 0], separacionPinza:[15, 4, 4], giroAntebrazoZ: [-60, -30]}, 6000) 
	.easing(TWEEN.Easing.Cubic.Out) 


	// Creacion interfaz
	const gui = new GUI();

	// Construccion del menu
	const h = gui.addFolder("Control esferaCubo");
	// h.add(effectController, "mensaje").name("Aplicacion");
	h.add(effectController, "giroBase", -180.0, 180.0, 0.025).name("Giro de la Base").listen();
	h.add(effectController, "giroBrazo", -45.0, 45.0, 0.025).name("Giro del Brazo").listen();
  h.add(effectController, "giroAntebrazoY", -180.0, 180.0, 0.025).name("Giro del Antebrazo (Y)").listen();
  h.add(effectController, "giroAntebrazoZ", -90.0, 90.0, 0.025).name("Giro del Antebrazo (Z)").listen();
  h.add(effectController, "giroPinzas", -40.0, 220.0, 0.025).name("Giro de Pinzas").listen();
  h.add(effectController, "separacionPinza", 0.0, 15.0, 0.025).name("Separacion Pinza").listen();
  h.add(effectController, 'alambre' ).name( 'Alambre' ).onChange( value => {
		
    actualMaterial ^= 1;
    updateMaterial(robot)
    
	} );
  h.add( effectController, 'animate' ).name( 'Animate' );
}

function update()
{
    robot.rotation.y = effectController.giroBase * Math.PI/180;
    arm.rotation.z = effectController.giroBrazo * Math.PI/180;
    forearm.rotation.y = effectController.giroAntebrazoY * Math.PI/180;
    forearm.rotation.z = effectController.giroAntebrazoZ * Math.PI/180;
    hand.rotation.z = effectController.giroPinzas * Math.PI/180;

    tweezer0.position.z = effectController.separacionPinza;
    tweezer1.position.z = -effectController.separacionPinza;
    TWEEN.update()
}

function render()
{
    requestAnimationFrame(render);
    controls.update();
    update()
    renderer.clear();

    const min_dim = Math.min(window.innerHeight, window.innerWidth)
    renderer.setViewport(0,window.innerHeight - min_dim/4, min_dim/4, min_dim/4);
    renderer.render(scene,minicam);

    renderer.setViewport(0,0, window.innerWidth,window.innerHeight);
    renderer.render(scene,camera);
}
