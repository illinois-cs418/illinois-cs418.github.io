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

/** @global The WebGL buffer holding the triangle */
var fanVertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var fanVertexColorBuffer;

/** @global The vertex array object for the triangle */
var vertexArrayObject1;

/** @global The vertex array object for the other triangle */
var vertexArrayObject2;

/** @global The rotation angle of our triangle */
var rotAngle = 0;

/** @global The ModelView matrix contains any modeling and viewing transformations */
var modelViewMatrix = glMatrix.mat4.create();

/** @global Records time last frame was rendered */
var previousTime = 0;

/** @global Number of vertices around circle boundary */
var numVertices = 100;

/** @global Time since last deformation of circle */
var elapsedTime = 0;

/** @global Displacements for circle boundary vertices */
var displacements = new Array(numVertices).fill(0);

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
 * Set up the buffers to hold the triangle's vertex positions and colors.
 */
function setupTriangleBuffer() {
    
  // Create the vertex array object, which holds the list of attributes for
  // the triangle.
  vertexArrayObject1 = gl.createVertexArray();
  gl.bindVertexArray(vertexArrayObject1); 

  // Create a buffer for positions, and bind it to the vertex array object.
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);

  // Define a triangle in clip coordinates.
  var vertices = [
         0.0,  0.5,  0.0,
        -0.5, -0.5,  0.0,
         0.5, -0.5,  0.0
  ];
  // Populate the buffer with the position data.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 3;

  // Binds the buffer that we just made to the vertex position attribute.
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  // Do the same steps for the color buffer.
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  var colors = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = 3;  
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                         vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
   // Enable each attribute we are using in the VAO.  
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    
  // Unbind the vertex array object to be safe.
  gl.bindVertexArray(null);
}


/**
 * Populate vertex buffer with data
  @param {number} number of vertices to use around the circle boundary
 */
function loadVertices(numVertices) {

//Generate the vertex positions    
  fanVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, fanVertexPositionBuffer);
    
  // Start with vertex at the origin    
  var fanTriangleVertices = [0.0,0.0,0.0];

  //Generate a triangle fan around origin
  var radius=0.5
  var z=0.0;
  var displacement = 0;
  var pointOffset = glMatrix.vec2.create();
 
  for (i=0;i<numVertices;i++){
      angle = i *  2 * Math.PI / numVertices;
      x=(radius * Math.cos(angle));
      y=(radius * Math.sin(angle));
      
      glMatrix.vec2.set(pointOffset,x,y);
      glMatrix.vec2.normalize(pointOffset,pointOffset);
      glMatrix.vec2.scale(pointOffset,pointOffset,
                          displacements[i]);
    
      //add the vertex coordinates to the array
      fanTriangleVertices.push(x+pointOffset[0]);
      fanTriangleVertices.push(y+pointOffset[1]);
      fanTriangleVertices.push(z);
  }
  fanTriangleVertices.push(fanTriangleVertices[3]);
  fanTriangleVertices.push(fanTriangleVertices[4]);
  fanTriangleVertices.push(z); 
    
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fanTriangleVertices), gl.DYNAMIC_DRAW);
  fanVertexPositionBuffer.itemSize = 3;
  fanVertexPositionBuffer.numberOfItems = numVertices+2;
  // Binds the buffer that we just made to the vertex position attribute.
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         fanVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
}

/**
 * Populate color buffer with data
  @param {number} number of vertices to use around the circle boundary
 */
function loadColors(numVertices) {
  fanVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, fanVertexColorBuffer);
    
  // Set the heart of the circle to be black    
  var fancolors = [0.0,0.0,0.0,1.0];
  
  var a=1.0;
  var g=0.0;
  var halfV= numVertices/2.0;
  for (i=0;i<=numVertices;i++){
      r=Math.abs((i-halfV)/halfV);
      b= 1.0-r;
      fancolors.push(r);
      fancolors.push(g);
      fancolors.push(b);
      fancolors.push(a);
  }
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fancolors), gl.STATIC_DRAW);
  fanVertexColorBuffer.itemSize = 4;
  fanVertexColorBuffer.numItems = numVertices+2;
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                         fanVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
}

/**
 * Populate buffers with data
   @param {number} number of vertices to use around the circle boundary
 */
function setupFanBuffers(numVertices) {
  // Create the vertex array object, which holds the list of attributes for
  // the triangle.
  vertexArrayObject2 = gl.createVertexArray();
  gl.bindVertexArray(vertexArrayObject2);     
    
  //Generate the vertex positions    
  loadVertices(numVertices);

  //Generate the vertex colors
  loadColors(numVertices);
    
   // Enable each attribute we are using in the VAO.  
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    
  // Unbind the vertex array object to be safe.
  gl.bindVertexArray(null);
}



/**
 * Draws a frame to the screen.
 */
function draw() {
  // Transform the clip coordinates so the render fills the canvas dimensions.
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

  // Clear the screen.
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Send the ModelView matrix with our transformations to the vertex shader.
  gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform,
                      false, modelViewMatrix);  
    
  if (document.getElementById("I").checked == true)
  {
    // Use the vertex array object that we set up.
        gl.bindVertexArray(vertexArrayObject1);
        gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
  }
  else
  {
    // Use the vertex array object that we set up.
        gl.bindVertexArray(vertexArrayObject2);
        // Render the triangle. 
        gl.drawArrays(gl.TRIANGLE_FAN, 0, numVertices+2);
  }
  
  // Unbind the vertex array object to be safe.
  gl.bindVertexArray(null);
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
     
 if (document.getElementById("I").checked == true){
        // Update geometry to rotate 'speed' degrees per second.
        rotAngle += speed * deltaTime;
        if (rotAngle > 360.0)
            rotAngle = 0.0;
        glMatrix.mat4.fromZRotation(modelViewMatrix, degToRad(rotAngle));
  }
  else{
    elapsedTime+=deltaTime;
    if(speed>0){   
        if (elapsedTime >= (50.0/speed))
        {
          //Generate a deformation of the vertex
          for(i=0;i<numVertices;i++)
            displacements[i] = 0.3*Math.random();
          elapsedTime =0.0;
          // Update deformation
          //setupFanBuffers(numVertices);
            
        }
    }
    glMatrix.mat4.identity(modelViewMatrix);
  }
     
  // Draw the frame.
  draw();
  setupFanBuffers(numVertices); 
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
  setupShaders(); 
  setupTriangleBuffer();
  setupFanBuffers(numVertices);     
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  requestAnimationFrame(animate); 
}

