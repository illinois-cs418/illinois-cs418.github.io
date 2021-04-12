---
layout: assignment
title: "MP4: Texturing Mapping"
index: 10
due: "April. 18, 2021 @ 11:59 PM"
material: ~
points: 50
rubric:
-
    name: OBJ File Reader
    points: 5
    description: OBJ file for the teapot is parsed correctly and loaded into buffers 
-
    name: View 
    points: 10
    description: The view of the teapot shows the entire mesh and is non-distorted 
- 
    name: Generate Texture Coordinates
    points: 10
    description: Appropriate per-vertex texture coordinates are generated for the teapot
-    
    name: Texture Mapping
    points: 10
    description: Teapot is texture-mapped using an interesting image texture.
-
    name: Shading
    points: 5
    description: Phong shading and the Phong reflection model are used and the teapot is well-lit
- 
    name: Model Rotation Using a Mouse
    points: 10
    description: Mesh can be rotated using mouse movement 
---

## Overview

![teapot](https://illinois-cs418.github.io/img/teapot-obj.png) 

 

For the fourth machine problem, you will implement a simple OBJ file reader and use it to read and render a mesh. You will also add support for texture mapping an image onto the mesh surface.

### Starter Code

+ [MP4.html](https://github.com/illinois-cs418/illinois-cs418.github.io/raw/master/Examples/MP4/MP4.html)
+ [MP4.js](https://github.com/illinois-cs418/illinois-cs418.github.io/raw/master/Examples/MP4/MP4.js)
+ [TriMesh.js](https://github.com/illinois-cs418/illinois-cs418.github.io/raw/master/Examples/MP4/TriMesh.js)
+ [gl-matrix-min.js](https://github.com/illinois-cs418/illinois-cs418.github.io/raw/master/Examples/MP4/gl-matrix-min.js)
+ [teapot.obj](https://github.com/illinois-cs418/illinois-cs418.github.io/raw/master/Examples/MP4/teapot.obj)
+ [triangle.obj](https://raw.githubusercontent.com/illinois-cs418/illinois-cs418.github.io/master/Examples/MP4/triangle.obj)
+ [brick.jpg](https://illinois-cs418.github.io/img/brick.jpg)

### Parsing an OBJ File

You only need to implement a reader that parses a subset of the full OBJ format. You just need to handle the tags `f`, `v` and `#`.

A concise description of the format and how to parse it can be found here:

[Parsing OBJ Files](https://illinois-cs418.github.io/ref-parse-obj.html)

Use the above linked teapot model, which consists only of vertices and triangular faces. Load the vertices into a vertex position array, and the triangle faces into a face array whose elements are triples of vertex indices. **Note that the indices of the vertices in the OBJ start at 1**. This means you will need to adjust them assuming your arrays start indexing at 0. You will need to create per-vertex normals for the mesh as well, which you should compute as the average normal of the the triangles incident on the vertex.

#### Implementation

You should complete the function `loadFromOBJ(fileText)` in the file `TriMesh.js` . You will likely find the [JS string method `split` ](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split) useful. A robust way to split handling white space is to use the separator `/\b\s+(?!$)/`

You also need to complete the function `canonicalTransform()` in the file `TriMesh.js`. This function generates a transformation matrix `this.modelMatrix` where  the transformation is $$M=ST$$  The $$T$$ matrix translates so that the center of the axis-aligned bounding box (AABB) is at the origin. The matrix $$S$$ scales uniformly by $$1/L$$ where $$L$$ is the length of the longest side of the AABB.

Once you have completed that code, you should be able to render the teapot as seen above.

When debugging, you might want to use the `triangle.obj` file which contains a single triangle.

### Running a Local Server ###

Typically, for security reasons your browser will not allow JS code to directly access files on your local file system.  To get around the issue of reading files from the local filesystem, it is best to test by running a local webserver. There are three relatively easy ways to do this:

+ If you use the Brackets editor, the live preview function will start up a server (and browser) to test your code. Just have Chrome open, and the open your html file in Brackets. Click the lightning bolt icon in the top right of the Brackets window.
+ Alternatively, you can install [node.js](https://nodejs.org/en/) Then install and run [httpserver](https://www.npmjs.com/package/httpserver) to serve the directory that you are in when you issue the command
+ if you have python on your system, use a command prompt to do `python -m http.server` which will serve files from the directory in which you issued the command. Theses will typically be served at `http://127.0.0.1:8000`. 

### Texture Mapping
Now we will load an image to use as a texture and send it to the fragment shader as a `uniform`. You can use the file [brick.jpg](https://illinois-cs418.github.io/img/brick.jpg) or a different image if you wish.

We will start by creating a global variable for the texture:

~~~javascript
/** @global Image texture to mapped onto mesh */
var texture;
~~~

Then we need a function to load the image from the file into a WebGL texture:

~~~javascript
/**
 * Load a texture from an image.
 */

function loadTexture(filename){
	// Create a texture.
	texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
 
	// Fill the texture with a 1x1 blue pixel.
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 255, 255]));
 
	// Asynchronously load an image
	// If image load unsuccessful, it will be a blue surface
	var image = new Image();
	image.src = filename;
	image.addEventListener('load', function() {
  		// Now that the image has loaded make copy it to the texture.
  		gl.bindTexture(gl.TEXTURE_2D, texture);
  		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
  		gl.generateMipmap(gl.TEXTURE_2D);
  		console.log("loaded ", filename);
		});
}
~~~

Then, in `startup` we will want add code call `loadTexture` and send the texture to a uniform variable:

~~~javascript
// Load a texture
  loadTexture("brick.jpg");
  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(shaderProgram.locations.uSampler, 0);    
~~~

Finally, in `setupShaders` you need to get the location of the uniform for the texture in the shader program:

~~~javascript
shaderProgram.locations.uSampler =
    gl.getUniformLocation(shaderProgram, "u_texture");
~~~

### Generating Texture Coordinates

In the shader, we need to generate texture coordinates at each fragment and use those to map into the image and sample a color.  One way to do this would be to have the JS code use some mathematical function mapping between the mesh shape and the rectangular image to generate per-vertex texture coordinates. High quality texture mapping will often take this approach, using shape specific texture coordinates for the model that were generated by an artist.

We will use a simpler, but more performant approach and generate texture coordinates directly in the shader for each vertex using _orthographic coordinates_.

In the vertex shader we will add a `varying` that we will send to the fragment shader:

~~~glsl
out vec2 v_texcoord;
~~~

And we will simply use the model space xy coordinates as texture coordinates in the body of the shader code:

~~~
v_texcoord = vertexPosition.xy;
~~~

 You should try an experiment and determine what happens if you use the view coordinate xy values instead...you may need to rotate the teapot (see the next section). This is the kind of thing you might get asked about on exam.

In the fragment shader we just need to take in the uniform holding the texture and the interpolated texture coordinates:

~~~
uniform sampler2D u_texture;

in vec2 v_texcoord;
~~~

and in the body of the fragment shader we sample a color from the image:

~~~
// Sample the texture
vec4 texColor = texture(u_texture, v_texcoord);
~~~



### Phong Shading

You should shade the color sampled from the texture so that it looks like it is really in the 3D scene you are drawing. This means that you should use the sampled color `texColor.rgb` from the texture in place of `kAmbient` and `kDiffuse` in the reflection model...effectively making it the material color. Since specular highlights are usually white, it would make sense to keep `kSpecular` as white. Once this is in place you should see something like this:

![teapot](https://illinois-cs418.github.io/img/brick_teapot.png)

### User Interaction Using a Mouse 

The model should rotate around the Y (up) axis if a mouse button is being held down and the mouse moves in the X direction.

To accomplish this you should add the following global variables:

~~~js
/** @global Is a mouse button pressed? */
var isDown = false;
/** @global Mouse coordinates */
var x = -1;
var y = -1;
/** @global Accumulated rotation around Y in degrees */
var rotY = 0;
~~~

And then add event listeners for `mousedown`, `mouseup`, and `mousemove` events. Here's an example for handling `mousedown`:

~~~javascript
canvas.addEventListener('mousedown', e => {
    x = e.offsetX;
    y = e.offsetY;
    isDown = true;
  });
~~~

This code assumes that the `canvas` variable is a reference to the HTML canvas object that is accessed in the `startup` function. You should add this code and the code for the other two event listeners in the `startup` function.  

The value `e.offsetX` is the location of the mouse pointer when the event happens.  The HTML5 canvas coordinate system has the origin in the top left corner as shown here:
![img](data:image/png;base64,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)

When a mouse button is down and the mouse moves, you should take the difference `e.offsetX - x` and add it to `rotY`. You should also update the global `x` and `y` variables to the values `e.offsetX` and `e.offsetY`.

In the `draw` function, you should apply a Y rotation to the model before applying the view transformation:

~~~javascript
glMatrix.mat4.identity(modelViewMatrix);
glMatrix.mat4.rotateY(modelViewMatrix,myMesh.getModelTransform(),degToRad(rotY));
glMatrix.mat4.lookAt(viewMatrix, eyePt, lookAtPt, up);
glMatrix.mat4.multiply(modelViewMatrix, viewMatrix, modelViewMatrix);
~~~

#### References

+ [Introduction to Events](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events)
+ [mousedown](https://developer.mozilla.org/en-US/docs/Web/API/Element/mousedown_event)
+ [mousemove](https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event)
+ [mouseup](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseup_event)




