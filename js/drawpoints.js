/*
    Seminario #1: Dibujar puntos con VBOs
*/

// Shader de vertices
const VSHADER_SOURCE = `
    attribute vec3 posicion;
    attribute vec3 color;
    varying vec3 vColor;

    void main(){
        gl_Position = vec4(posicion,1.0);
        gl_PointSize = 10.0;
        vColor = color;
    }
`

// Shader de fragmentos
const FSHADER_SOURCE = `

    precision mediump float;
    varying vec3 vColor;
    void main(){
        gl_FragColor = vec4(vColor, 1.0);
    }
`
// Globales
const clicks = [];
const grads = [];
let gl;
let bufferColors;
let bufferVertices;
let colorFragmento;
let initial_rgb;
const epsilon = 1e-8;

function main()
{
    // Recupera el lienzo
    const canvas = document.getElementById("canvas");
    gl = getWebGLContext( canvas );

    // Cargo shaders en programa de GPU
    if(!initShaders(gl,VSHADER_SOURCE,FSHADER_SOURCE)){
        console.log("La cosa no va bien");
    }

    // Color de borrado del lienzo
    gl.clearColor(0.98, 0.98, 0.98, 1.0);

    // Localiza el att del shader posicion
    const coordenadas = gl.getAttribLocation( gl.program, 'posicion');

    // Crea buffer, etc ...
    bufferVertices = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferVertices );
    gl.vertexAttribPointer( coordenadas, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( coordenadas );

    const colorFragmento = gl.getAttribLocation( gl.program, 'color' );

    bufferColors = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferColors );
    gl.vertexAttribPointer(colorFragmento, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( colorFragmento );
    

    // Registrar la call-back del click del raton
    canvas.onmousedown = function(evento){ click(evento,gl,canvas); };

    // Dibujar
    render( gl );
    
}

function click( evento, gl, canvas )
{
    let x = evento.clientX;
    let y = evento.clientY;
    const rect = evento.target.getBoundingClientRect();

    // Conversion de coordenadas al sistema webgl por defecto
    x = ((x-rect.left)-canvas.width/2) * 2/canvas.width;
    y = ( canvas.height/2 - (y-rect.top)) * 2/canvas.height;

	
	// Guardar las coordenadas y copia el array
	clicks.push(x); clicks.push(y); clicks.push(0.0);

  // Compute grad value

  let dist = 1. - Math.hypot(x, y)/Math.sqrt(2.0) // compute inverse normalized distace by square diagonal
  console.log(grads.length, dist)
  if(!grads.length)
    initial_rgb = Array.from({length: 3}, () => Math.random()+epsilon);
  console.log(initial_rgb)
  grads.push(initial_rgb[0]*dist); grads.push(initial_rgb[1]*dist); grads.push(initial_rgb[2]*dist);

	render( gl );
}

function render( gl )
{
	gl.clear( gl.COLOR_BUFFER_BIT );

	// Fija el color de TODOS los puntos
	// gl.uniform3f(colorFragmento, 1, 1, 0);


	// Rellena el BO activo con las coordenadas y lo manda a proceso
  
  gl.bindBuffer( gl.ARRAY_BUFFER, bufferVertices );
  gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(clicks), gl.STATIC_DRAW );

  gl.bindBuffer( gl.ARRAY_BUFFER, bufferColors );
  gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(grads), gl.STATIC_DRAW );

	gl.drawArrays( gl.LINE_STRIP, 0, clicks.length/3 )	
	gl.drawArrays( gl.POINTS, 0, clicks.length/3 )	
}