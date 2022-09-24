/**
 * Escena.js
 * 
 * Seminario GPC#2. Construir una escena básica con transformaciones e
 * importación de modelos.
 * @author <rvivo@upv.es>
 * 
 * 
 */

// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import {GLTFLoader} from "../lib/GLTFLoader.module.js";
import {OrbitControls} from "../lib/OrbitControls.module.js"
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

function init()
{
    // Instanciar el motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth,window.innerHeight);
    document.getElementById('container').appendChild( renderer.domElement );

    // Instanciar el nodo raiz de la escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.5,0.5,0.5);

    // Instanciar la camara
    camera= new THREE.PerspectiveCamera(100,window.innerWidth/window.innerHeight,1,400);
    // camera.position.set(5, 5, 2);
    camera.position.set(40, 180, 62);
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
    // Material sencillo
    const material = new THREE.MeshBasicMaterial({color:'yellow',wireframe:true});
    const material_actual = new THREE.MeshBasicMaterial({color:'red',wireframe:true});
    let floor_texture = new THREE.TextureLoader().load( 'images/suelo.jpg');
    floor_texture.wrapS = floor_texture.wrapT = THREE.RepeatWrapping;
    floor_texture.repeat.set(80, 80);
    floor_texture = new THREE.MeshBasicMaterial({map: floor_texture});

    // Suelo
    const suelo = new THREE.Mesh( new THREE.PlaneGeometry(1000,1000), floor_texture );
    suelo.rotation.x = -Math.PI/2;
    scene.add(suelo);

    // base
    const base = new THREE.Mesh( new THREE.CylinderGeometry(50, 50, 15, 100), material );

    // arm
    const arm_soulder = new THREE.Mesh( new THREE.CylinderGeometry(20, 20, 15, 100), material );
    const arm_humero = new THREE.Mesh( new THREE.BoxGeometry(18, 120, 12), material );
    const arm_elbow = new THREE.Mesh( new THREE.SphereGeometry(20, 20, 20), material );
    arm_soulder.rotation.z = -Math.PI/2
    arm_soulder.position.set(1, 13, 0)
    arm_humero.position.set(0, 13+60, 0)
    arm_elbow.position.set(0, 13+60*2, 0)
    
    const arm = new THREE.Object3D();
    arm.add(arm_soulder);
    arm.add(arm_humero);
    arm.add(arm_elbow);


    //forearm
    const arm_elbow2 = new THREE.Mesh( new THREE.CylinderGeometry(22, 22, 6, 100), material );
    const nerve_0 = new THREE.Mesh( new THREE.BoxGeometry(4, 80, 4), material );
    const nerve_1 = new THREE.Mesh( new THREE.BoxGeometry(4, 80, 4), material );
    const nerve_2 = new THREE.Mesh( new THREE.BoxGeometry(4, 80, 4), material );
    const nerve_3 = new THREE.Mesh( new THREE.BoxGeometry(4, 80, 4), material );

    arm_elbow2.position.set(0, 13+60*2, 0)
    nerve_0.position.set(22*0.5, 13+60*2+40+3, 22*0.5)
    nerve_1.position.set(-22*0.5, 13+60*2+40+3, 22*0.5)
    nerve_2.position.set(22*0.5, 13+60*2+40+3, -22*0.5)
    nerve_3.position.set(-22*0.5, 13+60*2+40+3, -22*0.5)
    
    
    const forearm = new THREE.Object3D();
    forearm.add(arm_elbow2);
    forearm.add(nerve_0);
    forearm.add(nerve_1 );
    forearm.add(nerve_2);
    forearm.add(nerve_3);


    //hand
    const wrist = new THREE.Mesh( new THREE.CylinderGeometry(15, 15, 40, 100), material );
    wrist.position.y = 13+60*2+80+3
    wrist.rotation.z = -Math.PI/2

    // tweezers   
    const tweezer0 = new Tweezers(material)
    const tweezer1 = new Tweezers(material)
    
    tweezer0.position.set(15, 13+60*2+80+3, 12.5)
    tweezer0.rotation.y = -Math.PI/2
    tweezer1.position.set(-15, 13+60*2+80+3, 12.5)
    tweezer1.rotation.y = -Math.PI/2
    

    const hand = new THREE.Object3D();
    forearm.add(wrist);
    forearm.add(tweezer0);
    forearm.add(tweezer1);

    forearm.add(hand)
    arm.add(forearm)

    robot = new THREE.Object3D();
    robot.add(base);
    robot.add(arm);
    robot.add(forearm);
    robot.position.y = 3.8;
    robot.scale.set(0.5,.5, .5)

    scene.add(robot);

    scene.add( new THREE.AxesHelper(3) );

    // Modelos importados
    const loader = new THREE.ObjectLoader();
    loader.load('models/soldado/soldado.json', 
    function (objeto)
    {
        cubo.add(objeto);
        objeto.position.y = 1;
    });

    const glloader = new GLTFLoader();
    glloader.load('models/RobotExpressive.glb',
    function(objeto)
    {
        esfera.add(objeto.scene);
        objeto.scene.position.y = 1;
        objeto.scene.rotation.y = -Math.PI/2;
        console.log("ROBOT");
        console.log(objeto);
    });
}

function update()
{
    angulo += 0.01;
    robot.rotation.y = angulo;
}

function render()
{
    requestAnimationFrame(render);
    update();
    controls.update();
    renderer.render(scene,camera);
}
