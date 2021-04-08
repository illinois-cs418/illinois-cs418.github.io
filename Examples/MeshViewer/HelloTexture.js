/**
 * @file A simple WebGL example drawing a triangle with colors
 * @author Eric Shaffer <shaffer1@eillinois.edu>
 * 
 * Updated Spring 2021 to use WebGL 2.0 and GLSL 3.00
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global The vertex array object for the triangle */
var vertexArrayObject;

/** @global The rotation angle of our triangle */
var rotAngle = 0;

/** @global The Model matrix contains any modeling transformations */
var modelMatrix = glMatrix.mat4.create();

/** @global The projection matrix contains the perspective transformation */
var projectionMatrix = glMatrix.mat4.create();

/** @global The ModelView matrix contains any modeling and viewing transformations */
var modelViewMatrix = glMatrix.mat4.create();

/** @global The Normal matrix contains any modeling and viewing transformations to apply to normals */
var normalMatrix = glMatrix.mat4.create();

/** @global Records time last frame was rendered */
var previousTime = 0;

/** @global An object holding the geometry for a 3D mesh */
var myMesh;

/** @global The new light vector after the view transformation */
var newLight = glMatrix.vec3.create();
/** @global The view direction matrix for the skybox */
var viewDirectionMatrix = glMatrix.mat4.create();
/** @global The view direction matrix multiplied by the projection matrix */
var viewDirectionProjectionMatrix = glMatrix.mat4.create();
/** @global The inverse of the last */
var viewDirectionProjectionInverseMatrix = glMatrix.mat4.create();
/** @global Used as a time variable */
var then = 0.0;

// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = glMatrix.vec3.fromValues(1.0, 0.0, 1.0); //(0.0, 0.0, 0.0)
/** @global Direction of the view in world coordinates */
var viewDir = glMatrix.vec3.fromValues(0.0,0.0,-1.0); //(0.0, 0.0, -1.0)
/** @global Up vector for view matrix creation, in world coordinates */
var up = glMatrix.vec3.fromValues(0.0,1.0,0.0); //(0.0, 1.0, 0.0)
/** @global Location of a point along viewDir in world coordinates */
var viewPt = glMatrix.vec3.fromValues(0.0,0.0,0.0); //(0.0, 0.0, 0.0)

//Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = [1,1,1];
/** @global Ambient light color/intensity for Phong reflection */
var lAmbient = [0.0,0.0,0.0]; //[0, 0, 0]
/** @global Diffuse light color/intensity for Phong reflection */
var lDiffuse = [1,1,1]; //[1, 1, 1]
/** @global Specular light color/intensity for Phong reflection */
var lSpecular =[1.0,1.0,1.0]; //[0, 0, 0]

//Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [1.0, 1.0, 1.0]; //[1.0, 1.0, 1.0]
/** @global Diffuse material color/intensity for Phong reflection */
var kMeshDiffuse = [0.929, 0.207, 0.788];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [1.0, 1.0, 1.0]; //[0.0, 0.0, 0.0]
/** @global Shininess exponent for Phong reflection */
var shininess = 23; //23
/** @global Edge color fpr wireframeish rendering */
var kEdgeBlack = [0.0,0.0,0.0]; //[0.0, 0.0, 0.0]
/** @global Edge color for wireframe rendering */
var kEdgeWhite = [1.0,1.0,1.0]; //[1.0, 1.0, 1.0]

/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}


/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var context = null;
  context = canvas.getContext("webgl2");
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}


/**
 * Loads a shader.
 * Retrieves the source code from the HTML document and compiles it.
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
    
  var shaderSource = shaderScript.text;
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}


/**
 * Set up the fragment and vertex shaders.
 */
function setupShaders() {
  // Compile the shaders' source code.
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  // Link the shaders together into a program.
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  // We only use one shader program for this example, so we can just bind
  // it as the current program here.
  gl.useProgram(shaderProgram);
    
  // Query the index of each attribute in the list of attributes maintained
  // by the GPU. 
  shaderProgram.vertexPositionAttribute =
    gl.getAttribLocation(shaderProgram, "aVertexPosition");
  shaderProgram.vertexColorAttribute =
    gl.getAttribLocation(shaderProgram, "aVertexColor");
    
  //Get the index of the Uniform variable as well
  shaderProgram.modelViewMatrixUniform =
    gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
}





/**
 * Draws a frame to the screen.
 */
function draw() {

  // Transform the clip coordinates so the render fills the canvas dimensions.
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

  // Clear the screen.
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  if (myMesh.loaded() ){
      
  myMesh.canonicalTransform(modelMatrix);
      
  // Generate the view matrix using lookat.
  const lookAtPt = glMatrix.vec3.fromValues(0.0, 0.0, 0.0);
  const eyePt = glMatrix.vec3.fromValues(0.0, 10.0, 1.0);
  const up = glMatrix.vec3.fromValues(0.0, 0.0, 1.0);
    
  glMatrix.mat4.lookAt(viewMatrix, eyePt, lookAtPt, up);

  // Rotate the model about the z-axis by the current rotation angle.
  glMatrix.mat4.rotateY(modelViewMatrix, modelMatrix,
                        degToRad(rotationAngle));
    
  glMatrix.mat4.multiply(modelViewMatrix,viewMatrix,modelViewMatrix);
    
  setMatrixUniforms();
    
  setLightUniforms(ambientLightColor, diffuseLightColor, specularLightColor,
                   lightPosition);
  
  // Draw the triangles, the wireframe, or both, based on the render selection.
  if (document.getElementById("polygon").checked) { 
    setMaterialUniforms(kAmbient, kDiffuse, kSpecular, shininess);
    myMesh.drawTriangles();
  }
  else if (document.getElementById("wirepoly").checked) {
    setMaterialUniforms(kAmbient, kDiffuse, kSpecular, shininess); 
    myMesh.drawTriangles();
    setMaterialUniforms(kAmbient, kEdgeBlack, kSpecular, shininess);
    myMesh.drawEdges();
  }
  else if (document.getElementById("wireframe").checked) {
    setMaterialUniforms(kAmbient, kEdgeWhite, kSpecular, shininess);
    myMesh.drawEdges();    
  }
 }
}

function handleKeyDown(event){
        }

/**
 * Animates the triangle by updating the ModelView matrix with a rotation
 * each frame.
 */
 function animate(currentTime) {
  // Read the speed slider from the web page.
  var speed = document.getElementById("speed").value;

  // Convert the time to seconds.
  currentTime *= 0.001;
  // Subtract the previous time from the current time.
  var deltaTime = currentTime - previousTime;
  // Remember the current time for the next frame.
  previousTime = currentTime;
     
  // Update geometry to rotate 'speed' degrees per second.
  rotAngle += speed * deltaTime;
  if (rotAngle > 360.0)
      rotAngle = 0.0;

  // Draw the frame.
  draw();
  
  // Animate the next frame. The animate function is passed the current time in
  // milliseconds.
  requestAnimationFrame(animate);
}


/**
 * Startup function called from html code to start the program.
 */
 function startup() {
  console.log("Starting animation...");
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
     
  // Load OBJ file
  myMesh = new TriMesh();
  myMesh.readFile("teapot.obj");
    
  // Generate the projection matrix using perspective projection.
  const near = 0.1;
  const far = 200.0;
  glMatrix.mat4.perspective(projectionMatrix, degToRad(45), 
                            gl.viewportWidth / gl.viewportHeight,
                            near, far);
       
  setupShaders(); 
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  requestAnimationFrame(animate); 
}

