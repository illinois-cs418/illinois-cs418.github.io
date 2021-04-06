/**
 * @file A simple WebGL example drawing a teapot
 * @author Eric Shaffer <shaffer1@illinois.edu>
 *
 * Modified by Jacob Elling <jelling2@illinois.edu>
 * Modified by Jason <junsitu2@illinois.edu> on Mar 28, 2021
 *
 * Heavily referenced throughout WebGLFundamentals:
 * 	https://webglfundamentals.org/webgl/lessons/webgl-environment-maps.html
 * and
 *	https://webglfundamentals.org/webgl/lessons/webgl-skybox.html
 */

/** @global The WebGL context */
var gl;
/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A GLSL shader program for texture mapping */
var textureProgram;
/** @global A GLSL shader program for Phong shading */
var phongProgram;
/** @global A GLSL shader program for Reflective Shading */
var reflectProgram;
/** @global A GLSL shader program for the London skybox */
var skyProgram;
/** @global A GLSL shader program for the custom scene */
var sceneProgram;

/** @global The ModelView matrix */
var mvMatrix = glMatrix.mat4.create();
/** @global The Model matrix */
var mMatrix = glMatrix.mat4.create();
/** @global The View matrix */
var vMatrix = glMatrix.mat4.create();
/** @global The Projection matrix */
var pMatrix = glMatrix.mat4.create();
/** @global The Normal matrix */
var nMatrix = glMatrix.mat3.create();
/** @global A glMatrix vector to use for transformations */
var transformVec = glMatrix.vec3.create();


/** @global An object holding the geometry for a 3D mesh */
var myMesh;
/** @global An array to hold the shader radio buttons */
var shaderRadio = [];
/** @global An array to hold the location radio buttons */
var locationRadio = [];

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


//------------------------------------------------------------------------
/**
 * Sends Model matrix to shader
 */
function uploadModelMatrixToShader() {
  gl.uniformMatrix4fv(phongProgram.mMatrixUniform, false, mMatrix);
}

//------------------------------------------------------------------------
/**
 * Sends View matrix to shader
 */
function uploadViewMatrixToShader() {
  gl.uniformMatrix4fv(phongProgram.vMatrixUniform, false, vMatrix);
}

//------------------------------------------------------------------------
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(phongProgram.pMatrixUniform, false, pMatrix);
}

//------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
    glMatrix.mat4.multiply(mvMatrix,vMatrix, mMatrix);
    glMatrix.mat3.fromMat4(nMatrix,mvMatrix);
    glMatrix.mat3.transpose(nMatrix,nMatrix);
    glMatrix.mat3.invert(nMatrix,nMatrix);
    gl.uniformMatrix3fv(phongProgram.nMatrixUniform, false, nMatrix);
}

//------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    uploadModelMatrixToShader();
    uploadViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//------------------------------------------------------------------------
/**
 * Sends material information to the shader
 * @param {Float32} alpha shininess coefficient
 * @param {Float32Array} a Ambient material color
 * @param {Float32Array} d Diffuse material color
 * @param {Float32Array} s Specular material color
 */
function setMaterialUniforms(alpha,a,d,s) {
  gl.uniform1f(phongProgram.uniformShininessLoc, alpha);
  gl.uniform3fv(phongProgram.uniformAmbientMaterialColorLoc, a);
  gl.uniform3fv(phongProgram.uniformDiffuseMaterialColorLoc, d);
  gl.uniform3fv(phongProgram.uniformSpecularMaterialColorLoc, s);

}

//------------------------------------------------------------------------
/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function setLightUniforms(loc,a,d,s) {
  gl.uniform3fv(phongProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(phongProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(phongProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(phongProgram.uniformSpecularLightColorLoc, s);
}

//------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//------------------------------------------------------------------------
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

//------------------------------------------------------------------------
/**
 * Loads Shaders
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

//------------------------------------------------------------------------
/**
 * Setup the skybox used to render the London cubemap
 */
function setupLondon() {
    vertexShader = loadShaderFromDOM("cubemap-shader-vs");
    fragmentShader = loadShaderFromDOM("cubemap-shader-fs");
    
	// create program
    skyProgram = gl.createProgram();
    gl.attachShader(skyProgram, vertexShader);
    gl.attachShader(skyProgram, fragmentShader);
    gl.linkProgram(skyProgram);
    
    if (!gl.getProgramParameter(skyProgram, gl.LINK_STATUS)) {alert("Failed to setup shaders");}
    
	// get attribute/uniform locations
    skyProgram.vertexPositionAttribute = gl.getAttribLocation(skyProgram, "aPosition");
    skyProgram.skyboxLocation = gl.getUniformLocation(skyProgram, "uSkybox");
    skyProgram.VDPInverseLocation = gl.getUniformLocation(skyProgram, "uVDPInverse");
    
    // create vertices for skybox
    skyProgram.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, skyProgram.positionBuffer);
    var quads = new Float32Array(
        [
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1,
        ]);
    gl.bufferData(gl.ARRAY_BUFFER, quads, gl.STATIC_DRAW);
    
	// create and bind a texture
    skyProgram.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyProgram.texture);
    const faceInfos = [
    {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: 'London/pos-x.png',},
    {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: 'London/neg-x.png',},
    {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: 'London/pos-y.png',},
    {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: 'London/neg-y.png',},
    {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: 'London/pos-z.png',},
    {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: 'London/neg-z.png',},
    ];
    
	// for each face texture the image to it
    faceInfos.forEach((faceInfo) => {
        const {target, url} = faceInfo;
        const level = 0;
        const internalFormat = gl.RGB;
        const width = 512;
        const height = 512;
        const format = gl.RGB;
        const type = gl.UNSIGNED_BYTE;
        gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);
        
        const image = new Image();
        image.src = url;
        image.addEventListener('load', function() {
          gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyProgram.texture);
          gl.texImage2D(target, level, internalFormat, format, type, image);
          gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        });
      });
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
}

//------------------------------------------------------------------------
/**
 * Draw the London cubemap as a skybox
 */
function drawLondon() {
    gl.depthFunc(gl.LEQUAL);
    gl.useProgram(skyProgram);
    
    gl.enableVertexAttribArray(skyProgram.vertexPositionAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, skyProgram.positionBuffer);
    gl.vertexAttribPointer(skyProgram.vertexPositionAttribute,2,gl.FLOAT,false,0,0);
    
	// setup VDPInverse Matrix
    glMatrix.mat4.copy(viewDirectionMatrix, vMatrix);
    viewDirectionMatrix[12] = 0;
    viewDirectionMatrix[13] = 0;
    viewDirectionMatrix[14] = 0;
    glMatrix.mat4.multiply(viewDirectionProjectionMatrix, pMatrix, viewDirectionMatrix);
    glMatrix.mat4.invert(viewDirectionProjectionInverseMatrix, viewDirectionProjectionMatrix);
    
    // upload uniforms
    gl.uniformMatrix4fv(skyProgram.VDPInverseLocation, false, viewDirectionProjectionInverseMatrix);
    gl.uniform1i(skyProgram.skyboxUniform, 0);
    
	// draw the skybox
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    gl.disableVertexAttribArray(skyProgram.vertexPositionAttribute);
}

//------------------------------------------------------------------------
/**
 * Setup the custom cubemap skybox in front of Ikenberry
 */
function setupIke() {
    vertexShader = loadShaderFromDOM("cubemap-shader-vs");
    fragmentShader = loadShaderFromDOM("cubemap-shader-fs");
    
	// create program
    sceneProgram = gl.createProgram();
    gl.attachShader(sceneProgram, vertexShader);
    gl.attachShader(sceneProgram, fragmentShader);
    gl.linkProgram(sceneProgram);
    
    if (!gl.getProgramParameter(sceneProgram, gl.LINK_STATUS)) {alert("Failed to setup shaders");}
    
	// get attribute/uniform locations
    sceneProgram.vertexPositionAttribute = gl.getAttribLocation(sceneProgram, "aPosition");
    sceneProgram.skyboxLocation = gl.getUniformLocation(sceneProgram, "uSkybox");
    sceneProgram.VDPInverseLocation = gl.getUniformLocation(sceneProgram, "uVDPInverse");
    
    // create vertices for skybox
    sceneProgram.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sceneProgram.positionBuffer);
    var quads = new Float32Array(
        [
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1,
        ]);
    gl.bufferData(gl.ARRAY_BUFFER, quads, gl.STATIC_DRAW);
    
	// create and bind a texture
    sceneProgram.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, sceneProgram.texture);
    const faceInfos = [
    {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: 'Ike/pos-x.png',},
    {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: 'Ike/neg-x.png',},
    {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: 'Ike/pos-y.png',},
    {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: 'Ike/neg-y.png',},
    {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: 'Ike/pos-z.png',},
    {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: 'Ike/neg-z.png',},
    ];
    
	// for each face texture the image to it
    faceInfos.forEach((faceInfo) => {
        const {target, url} = faceInfo;
        
        const level = 0;
        const internalFormat = gl.RGB;
        const width = 512;
        const height = 512;
        const format = gl.RGB;
        const type = gl.UNSIGNED_BYTE;
        gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);
        
        const image = new Image();
        image.src = url;
        image.addEventListener('load', function() {
          gl.bindTexture(gl.TEXTURE_CUBE_MAP, sceneProgram.texture);
          gl.texImage2D(target, level, internalFormat, format, type, image);
          gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        });
      });
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
}

//------------------------------------------------------------------------
/**
 * Draw the skybox of the cube map in front of the Ikenberry
 */
function drawIke() {
    gl.depthFunc(gl.LEQUAL);
    gl.useProgram(sceneProgram);
    
    gl.enableVertexAttribArray(sceneProgram.vertexPositionAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, sceneProgram.positionBuffer);
    gl.vertexAttribPointer(sceneProgram.vertexPositionAttribute,2,gl.FLOAT,false,0,0);
    
	// setup VDPInverse Matrix
    glMatrix.mat4.copy(viewDirectionMatrix, vMatrix);
    viewDirectionMatrix[12] = 0;
    viewDirectionMatrix[13] = 0;
    viewDirectionMatrix[14] = 0;
    glMatrix.mat4.multiply(viewDirectionProjectionMatrix, pMatrix, viewDirectionMatrix);
    glMatrix.mat4.invert(viewDirectionProjectionInverseMatrix, viewDirectionProjectionMatrix);
    
    // upload uniforms
    gl.uniformMatrix4fv(sceneProgram.VDPInverseLocation, false, viewDirectionProjectionInverseMatrix);
    gl.uniform1i(sceneProgram.skyboxUniform, 0);
    
	// draw the skybox
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    gl.disableVertexAttribArray(sceneProgram.vertexPositionAttribute);
}

//------------------------------------------------------------------------
/**
 * Setup the fragment and vertex shaders for Phong shading
 */
function setupTeapotPhong() {
	vertexShader = loadShaderFromDOM("phong-shader-vs");
	fragmentShader = loadShaderFromDOM("phong-shader-fs");
	
	// create program
	phongProgram = gl.createProgram();
	gl.attachShader(phongProgram, vertexShader);
	gl.attachShader(phongProgram, fragmentShader);
	gl.linkProgram(phongProgram);

	if (!gl.getProgramParameter(phongProgram, gl.LINK_STATUS)) {
	    alert("Failed to setup shaders");
	}

	gl.useProgram(phongProgram);

	// get attribute locations
	phongProgram.vertexPositionAttribute = gl.getAttribLocation(phongProgram, "aVertexPosition");
	phongProgram.vertexNormalAttribute = gl.getAttribLocation(phongProgram, "aVertexNormal");
	// get uniform locations
	phongProgram.mMatrixUniform = gl.getUniformLocation(phongProgram, "uMMatrix");
	phongProgram.vMatrixUniform = gl.getUniformLocation(phongProgram, "uVMatrix");
	phongProgram.pMatrixUniform = gl.getUniformLocation(phongProgram, "uPMatrix");
	phongProgram.nMatrixUniform = gl.getUniformLocation(phongProgram, "uNMatrix");
	phongProgram.uniformLightPositionLoc = gl.getUniformLocation(phongProgram, "uLightPosition");
	phongProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(phongProgram, "uAmbientLightColor");
	phongProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(phongProgram, "uDiffuseLightColor");
	phongProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(phongProgram, "uSpecularLightColor");
	phongProgram.uniformShininessLoc = gl.getUniformLocation(phongProgram, "uShininess");
	phongProgram.uniformAmbientMaterialColorLoc = gl.getUniformLocation(phongProgram, "uKAmbient");
	phongProgram.uniformDiffuseMaterialColorLoc = gl.getUniformLocation(phongProgram, "uKDiffuse");
	phongProgram.uniformSpecularMaterialColorLoc = gl.getUniformLocation(phongProgram, "uKSpecular");
}

//------------------------------------------------------------------------
/**
 * Draw the teapot using phong shading
 */
function drawTeapotPhong() {
    gl.depthFunc(gl.LESS);
    gl.useProgram(phongProgram);

    gl.enableVertexAttribArray(phongProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(phongProgram.vertexNormalAttribute);
    
    setMatrixUniforms();
    setLightUniforms(newLight, lAmbient, lDiffuse, lSpecular);
    setMaterialUniforms(shininess,kAmbient, kMeshDiffuse, kSpecular);
    
    myMesh.drawTriangles();
    
    gl.disableVertexAttribArray(phongProgram.vertexPositionAttribute);
    gl.disableVertexAttribArray(phongProgram.vertexNormalAttribute);
}

//------------------------------------------------------------------------
/**
 * Setup vertex and fragment shaders for Reflective shading
 */
function setupTeapotReflect() {
    vertexShader = loadShaderFromDOM("reflect-shader-vs");
    fragmentShader = loadShaderFromDOM("reflect-shader-fs");
	
	// create program
    reflectProgram = gl.createProgram();
    gl.attachShader(reflectProgram, vertexShader);
    gl.attachShader(reflectProgram, fragmentShader);
    gl.linkProgram(reflectProgram);
    
    if (!gl.getProgramParameter(reflectProgram, gl.LINK_STATUS)) {alert("Failed to setup shaders");}
    
    gl.useProgram(reflectProgram);
    
	// get attribute locations
	reflectProgram.vertexPositionAttribute = gl.getAttribLocation(reflectProgram, "vPosition");
	reflectProgram.vertexNormalAttribute = gl.getAttribLocation(reflectProgram, "vNormal");
	// get uniform locations
	reflectProgram.mMatrixUniform = gl.getUniformLocation(reflectProgram, "mMatrix");
	reflectProgram.vMatrixUniform = gl.getUniformLocation(reflectProgram, "vMatrix");
	reflectProgram.pMatrixUniform = gl.getUniformLocation(reflectProgram, "pMatrix");
	reflectProgram.eyePosUniform = gl.getUniformLocation(reflectProgram, "eyePos");
	reflectProgram.texUniform = gl.getUniformLocation(reflectProgram, "texMap");
	// get location for reflection/refraction bool
	reflectProgram.refBool = gl.getUniformLocation(reflectProgram, "rBool");
  }

//------------------------------------------------------------------------
/**
 * Draw the teapot using reflective shading
 */
function drawTeapotReflect() {
	gl.depthFunc(gl.LESS);
	gl.useProgram(reflectProgram);
	
	gl.enableVertexAttribArray(reflectProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(reflectProgram.vertexNormalAttribute);
	
	// upload uniforms
	gl.uniformMatrix4fv(reflectProgram.mMatrixUniform, false, mMatrix);
	gl.uniformMatrix4fv(reflectProgram.vMatrixUniform, false, vMatrix);
	gl.uniformMatrix4fv(reflectProgram.pMatrixUniform, false, pMatrix);
	gl.uniform3fv(reflectProgram.eyePosUniform, eyePt);
	gl.uniform1i(reflectProgram.texUniform, 0);
	
	// bind vertex buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, myMesh.VertexPositionBuffer);
    gl.vertexAttribPointer(reflectProgram.vertexPositionAttribute,
						 myMesh.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

	// bind normal buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, myMesh.VertexNormalBuffer);
	gl.vertexAttribPointer(reflectProgram.vertexNormalAttribute, 
					   myMesh.VertexNormalBuffer.itemSize,
					   gl.FLOAT, false, 0, 0);   

	// draw 
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, myMesh.IndexTriBuffer);
	gl.drawElements(gl.TRIANGLES, myMesh.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
	
	
	gl.disableVertexAttribArray(reflectProgram.vertexPositionAttribute);
    gl.disableVertexAttribArray(reflectProgram.vertexNormalAttribute);
	
}

//------------------------------------------------------------------------
/**
 * Prevent CORS error, clear origin
 */
function requestCORSIfNotSameOrigin(img, url) {
    if (new URL(url, window.location.href).origin !== window.location.origin) {
      img.crossOrigin = "";
    }
}

//------------------------------------------------------------------------
/**
 * Setup texture coordinates for texture mapping
 * includes loading a texture image from local file system or online link
 */
function setupTextureCoordinates() {
    // load shaders
    vertexShader = loadShaderFromDOM("texture-shader-vs");
    fragmentShader = loadShaderFromDOM("texture-shader-fs");

     // create program tnd link shaders into a program
	textureProgram= gl.createProgram();
    gl.attachShader(textureProgram, vertexShader);
    gl.attachShader(textureProgram, fragmentShader);
    gl.linkProgram(textureProgram);
    if (!gl.getProgramParameter(textureProgram, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
    }

	// get attribute locations
	textureProgram.vertexPositionAttribute = gl.getAttribLocation(textureProgram, "aVertexPosition");
	textureProgram.vertexNormalAttribute   = gl.getAttribLocation(textureProgram, "aVertexNormal");

	// get uniform locations
	textureProgram.mMatrixUniform = gl.getUniformLocation(textureProgram, "uMMatrix");
	textureProgram.vMatrixUniform = gl.getUniformLocation(textureProgram, "uVMatrix");
	textureProgram.pMatrixUniform = gl.getUniformLocation(textureProgram, "uPMatrix");
	textureProgram.nMatrixUniform = gl.getUniformLocation(textureProgram, "uNMatrix");

    // added for texture coordinates
    textureProgram.textureLocation     = gl.getUniformLocation(textureProgram, "uTexture");
    textureProgram.textureModeLocation = gl.getUniformLocation(textureProgram, "mode");

    // Create a new "texture object"
    var textureObject = gl.createTexture();

    // load surface texture image 
    var url = 'brick.jpg'; // can be replace with another image url
    var img = new Image();
    requestCORSIfNotSameOrigin(img, url)
    img.src = url;
    img.addEventListener('load', function() {
      console.log('Texture image: (' + img.height + ":" + img.width + ')');
   
      // bind to the TEXTURE_2D bind point of texture unit 2
      gl.bindTexture(gl.TEXTURE_2D, textureObject);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
    });
}

//------------------------------------------------------------------------
/**
 * Draw the teapot using texture coordinates
 * 
 * @param mode texture projection method - 0: cylindrical 1: cubical
 */
function drawTeapotWithTexture(mode) {
	gl.depthFunc(gl.LESS);
    gl.useProgram(textureProgram);

	gl.enableVertexAttribArray(textureProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(textureProgram.vertexNormalAttribute);


    gl.uniform1i(textureProgram.textureModeLocation, mode);
    gl.uniformMatrix4fv(textureProgram.mMatrixUniform, false, mMatrix);
    gl.uniformMatrix4fv(textureProgram.vMatrixUniform, false, vMatrix);
    gl.uniformMatrix4fv(textureProgram.pMatrixUniform, false, pMatrix);
    glMatrix.mat4.multiply(mvMatrix,vMatrix, mMatrix);
    glMatrix.mat3.fromMat4(nMatrix,mvMatrix);
    glMatrix.mat3.transpose(nMatrix,nMatrix);
    glMatrix.mat3.invert(nMatrix,nMatrix);
    gl.uniformMatrix3fv(textureProgram.nMatrixUniform, false, nMatrix);

    myMesh.drawTrianglesToProgram(textureProgram);

	gl.disableVertexAttribArray(textureProgram.vertexPositionAttribute);
    gl.disableVertexAttribArray(textureProgram.vertexNormalAttribute);
}


//------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and 
 * draws model in frame
 */
function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// check whether to orbit or not
	if (document.getElementById("orbit").checked) {
		eyePt = [Math.cos(then * 0.1)*3, 1.25, Math.sin(then * 0.1)*3];
		then += 0.025;
	}

    glMatrix.mat4.lookAt(vMatrix,eyePt,viewPt, up);
    glMatrix.vec3.transformMat4(newLight, lightPosition, vMatrix);
	
	// if the teapot is loaded then draw otherwise skip it
	if (myMesh.loaded()) {
		shaderRadio     = document.getElementsByName("shade");
        projectionRadio = document.getElementsByName("projection");
		
		if (shaderRadio[0].checked) {
			drawTeapotPhong();
		} else if (shaderRadio[1].checked) {
			gl.useProgram(reflectProgram);
			gl.uniform1f(reflectProgram.refBool, 0.0);
			drawTeapotReflect();
		} else if (shaderRadio[2].checked) {
			gl.useProgram(reflectProgram);
			gl.uniform1f(reflectProgram.refBool, 1.0);
			drawTeapotReflect();
		} else if (shaderRadio[3].checked) {
            // Tell the shader program to use "texture unit" 
			gl.useProgram(textureProgram);
            gl.uniform1i(textureProgram.textureLocation, 0);
            var mode = projectionRadio[0].checked ? 0 : 1;
            drawTeapotWithTexture(mode);
        }
	}
	
	locationRadio = document.getElementsByName("scene");
	if (locationRadio[0].checked) {
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyProgram.texture);
		drawLondon();
	} else {
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, sceneProgram.texture);
		drawIke();
	}
    
    requestAnimationFrame(draw);
}

/*
 * Do all the pre-draw work
 */
function init() {
    //Setup viewport
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    
    //Set up the projection matrix pMatrix
    glMatrix.mat4.perspective(pMatrix,degToRad(70),
                     gl.viewportWidth / gl.viewportHeight, 1, 2000);
    
    //Set up the model matrix mMatrix
    glMatrix.vec3.set(transformVec,0.33,0.33,0.33);
    glMatrix.mat4.scale(mMatrix, mMatrix, transformVec);
    
}

//------------------------------------------------------------------------
/**
 * Populate buffers with data
 * #Copied from slides
 */
function setupMesh(filename) {
    myMesh = new TriMesh();
    myPromise = asyncGetFile(filename);
    myPromise.then((retrievedText) => {
        myMesh.loadFromOBJ(retrievedText);
        console.log("Yay! Got the file");
    })
    .catch(
        (reason) => {
            console.log('Handle rejected promise ('+reason+') here.');
        });
}

//------------------------------------------------------------------------
/**
 * Asynchronously read a server-side text file
 * #Copied from slides
 */
function asyncGetFile(url) {
    console.log("Getting text file");
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.onload = () => resolve(xhr.responseText);
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send();
        console.log("Made promise");
    });
}

//------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
 function startup() {
	canvas = document.getElementById("myGLCanvas");
	gl = createGLContext(canvas);

	init();
	setupMesh("teapot.obj");
    setupTextureCoordinates();
	setupLondon();
	setupIke();
	setupTeapotPhong();
	setupTeapotReflect();
	
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	requestAnimationFrame(draw);
}
