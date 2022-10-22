import * as THREE from "../lib/three.module.js";
import {GLTFLoader} from "../lib/GLTFLoader.module.js";
import {OrbitControls} from "../lib/OrbitControls.module.js"
import {Tweezers} from "./tweezers.js"
import {GUI} from "../lib/lil-gui.module.min.js";
import {TWEEN} from "../lib/tween.module.min.js";

// Variables estandara
let renderer, scene, camera, controls, minicam, metal_material = [];
let effectController, forearm, hand, tweezer0, tweezer1;

// Otras globales
let robot, arm;
const L = 18;
let angulo = 0, tween;

// Acciones
init();
loadScene();
setupGUI();
render();

export function addLighting(scene) {


  let light = new THREE.DirectionalLight(0xFFFFFF, 0.6);
  light.position.set(25, 20, -25);
  light.shadow.camera.top = 30;
  light.shadow.camera.left = -30;
  light.shadow.camera.right = 30;
  light.penumbra = 0.9;
  light.target.position.set(0,1,0);
  light.castShadow = true;
  scene.add(light);


  const ambiental = new THREE.AmbientLight(0x222222);
  scene.add(ambiental);
  
  const focal = new THREE.SpotLight(0xFFFFFF,0.7);
  focal.position.set(-25,60,-25);
  focal.target.position.set(0,0,0);
  focal.angle= Math.PI/9;
  focal.penumbra = 0.3;
  focal.castShadow= true;
  focal.shadow.camera.far = 100;
  focal.shadow.camera.fov = 80;
  scene.add(focal);
  // scene.add(new THREE.CameraHelper(light.shadow.camera));
  // scene.add(new THREE.CameraHelper(focal.shadow.camera));
}

function set_cameras(){

  const ar = window.innerWidth/window.innerHeight

  minicam  = new THREE.OrthographicCamera(-L*ar,L*ar,L,-L,0,250);
  minicam.position.set(0,100,0);
  minicam.lookAt(0,0,0);

  // Instanciar la camara
  camera= new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,1,1000);

  camera.position.set(20,60,20);
  camera.lookAt(0,1,0);

}


function init()
{
    // Instanciar el motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.setClearColor(new THREE.Color(0.7,0.7,0.7));
    renderer.autoClear = false;
    renderer.antialias = true;
    renderer.shadowMap.enabled = true;

    document.getElementById('container').appendChild( renderer.domElement );

    // Instanciar el nodo raiz de la escena
    scene = new THREE.Scene();
    
    set_cameras();
    addLighting(scene)
    

    controls = new OrbitControls( camera, renderer.domElement );
    controls.listenToKeyEvents( window ); // optional

    controls.enableDamping = true; 
    controls.dampingFactor = 0.05;

    controls.maxDistance = 60;
    controls.minDistance = 30;
    controls.maxPolarAngle = Math.PI / 3;

    window.addEventListener('resize', updateAspectRatio );

}

function updateShadows(node){

  if(!node.children.length){
    node.castShadow = node.receiveShadow = true
    return;
  }

  for(var i = 0; i < node.children.length; i++)
  updateShadows(node.children[i])

}


function createMaterialArray() {

  const skyboxImagepaths =  ["posx", "negx", "posy", "negy", "posz", "negz"].map(side => {
      return  "images/" + side + '.jpg';
  });

  const materialArray = skyboxImagepaths.map(image => {
    let texture = new THREE.TextureLoader().load(image);
    return new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  });
  
  return materialArray;
}

function loadScene()
{
    const path ="images/";
    let metal = new THREE.TextureLoader().load( 'images/metal_128.jpg');
    metal.wrapS = metal.wrapT = THREE.RepeatWrapping;
    metal.repeat.set(2, 2 );
    let lambertmetal = new THREE.MeshLambertMaterial({ map:metal})
    let phongmetal = new THREE.MeshPhongMaterial({ color:0xcd7f32  , specular:'gray',shininess: 20, map:metal})
    
    metal_material.push(lambertmetal);
    metal_material.push(phongmetal);
    
    let floor_texture = new THREE.TextureLoader().load( 'images/pisometalico_1024.jpg');
    floor_texture.wrapS = floor_texture.wrapT = THREE.RepeatWrapping;
    floor_texture.repeat.set(3,3);

    const entorno = [ path+"posx.jpg", path+"negx.jpg",
                      path+"posy.jpg", path+"negy.jpg",
                      path+"posz.jpg", path+"negz.jpg"];
    const texesfera = new THREE.CubeTextureLoader().load(entorno);
    const matesfera = new THREE.MeshPhongMaterial({color:'white',
                                                   specular:'gray',
                                                   shininess: 30,
                                                   envMap: texesfera });



    // Suelo
    floor_texture = new THREE.MeshStandardMaterial({color:"rgb(150,150,150)",map:floor_texture});
    const suelo = new THREE.Mesh( new THREE.PlaneGeometry(100,100, 100, 100), floor_texture );
    suelo.rotation.x = -Math.PI/2;
    suelo.position.y = -0.2;
    suelo.receiveShadow = true;
    scene.add(suelo);

    // base
    const base = new THREE.Mesh( new THREE.CylinderGeometry(50, 50, 15, 100), metal_material[0] );

    // arm
    const arm_soulder = new THREE.Mesh( new THREE.CylinderGeometry(20, 20, 15, 100), metal_material[0] );
    arm_soulder.rotation.set(0, Math.PI/2, Math.PI/2) 

    const arm_humero = new THREE.Mesh( new THREE.BoxGeometry(18, 120, 12), metal_material[0] );
    const arm_elbow = new THREE.Mesh( new THREE.SphereGeometry(20, 20, 20), matesfera );

    arm_humero.position.set(0, 60, 0)
    arm_elbow.position.set(0, 60*2, 0)
    
    arm = new THREE.Object3D();
    arm.add(arm_soulder);
    arm.add(arm_humero);
    arm.add(arm_elbow);

    //forearm
    const arm_elbow2 = new THREE.Mesh( new THREE.CylinderGeometry(22, 22, 6, 100), metal_material[1] );
    const nerve_0 = new THREE.Mesh( new THREE.BoxGeometry(4, 80, 4), metal_material[1] );
    const nerve_1 = new THREE.Mesh( new THREE.BoxGeometry(4, 80, 4), metal_material[1] );
    const nerve_2 = new THREE.Mesh( new THREE.BoxGeometry(4, 80, 4), metal_material[1] );
    const nerve_3 = new THREE.Mesh( new THREE.BoxGeometry(4, 80, 4), metal_material[1] );

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
    const wrist = new THREE.Mesh( new THREE.CylinderGeometry(15, 15, 40, 100), metal_material[1] );
    wrist.rotation.x = Math.PI/2

    // tweezers   
    tweezer0 = new Tweezers(metal_material[1])
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
    updateShadows(robot);
    robot.scale.set(0.1,.1, .1)

    scene.add(robot); 

    const habitacion = new THREE.Mesh( new THREE.BoxGeometry(300,300,200),createMaterialArray());
    scene.add(habitacion);

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
