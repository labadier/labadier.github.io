import * as THREE from "../lib/three.module.js";

const tweezersVertices = [
  10,0,2,    10,0,-2,    5, 19,-1,    5, 19,1,
  -5, 19, 1,  -5, 19, -1, -10,0, -2,  -10,0, 2,  
  ];

const indicesOfTweezers= [ 
0,3,7, 7,3,4, 0,1,2, 
0,2,3, 4,3,2, 4,2,5,
6,7,4, 6,4,5, 1,5,2,
1,6,5, 7,6,1, 7,1,0 ];


class Tweezers{

  constructor(material){

    const tweezers_geometry = new THREE.BufferGeometry();
    tweezers_geometry.setIndex( indicesOfTweezers );
    tweezers_geometry.setAttribute( 'position', new THREE.Float32BufferAttribute(tweezersVertices,3));
    tweezers_geometry.computeVertexNormals() 
    const palm = new THREE.Mesh( new THREE.BoxGeometry(19, 20, 4), material );
    const tweezer = new THREE.Mesh(  tweezers_geometry, material );
    tweezer.rotation.z = -Math.PI/2

    palm.position.set(0, 0, 0)
    tweezer.position.set(9.5, 0, 0)

    const tweezerobj  = new THREE.Object3D();
    tweezerobj.add(palm);
    tweezerobj.add(tweezer);

    return tweezerobj
  }
}

export { Tweezers };