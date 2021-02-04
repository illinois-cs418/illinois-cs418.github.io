---
layout: assignment
title: "MP1: Dancing Logo"
index: 10
due: "Feb. 16, 2021 @ 11:59 PM"
material: ~
points: 10
rubric:
  -
    name: Runs and renders
    points: 1
    description: Program runs without crashing and renders multiple frames.
  -
    name: Commented
    points: 1
    description: Each function in your code is commented in the required style.
  - 
    name: Affine Transformation
    points: 1
    description: Affine transformations used in the vertex shader
  - 
    name: Logo
    points: 2
    description: Logo model looks substantially like the provided image	and is a set of triangles.
  - 
    name: Change coordinates in buffer
    points: 2
    description: Non-uniform transformation implemented by changing coordinates in buffer	
  -
    name: Second animation
    points: 2
    description: Implement your own animation, different than the logo
  -
    name: Creativity
    points: 1
    description: Is your animation significantly different than the logo and visually interesting
---

![University of Illinois Logo](/img/ilogo.png)

For your first Machine Problem, you will create **two** animations: 

+ a 2-D animation of the majestic and inspiring University of Illinois logo (as shown above)
+ you will also create a short 2-D animation of your choice…more details below

The webpage for your application should include a radio button that allows viewers to switch which animation is rendered.

## Coding Requirements

Your application must use JavaScript with WebGL 2.0. Your shaders should use GLSL 3.00 ES. You code must have comments for each function explaining what that function does, using the [Google JS commenting style](https://google.github.io/styleguide/jsguide.html#formatting-comments).

## Block I Animation

Your first animation will be a 2D "dancing" University of Illinois logo. The logo should look essentially like image shown above. You do not have to match the orange perfectly. You do not need to make the I curve as in the logo…just create a straight-line block I model.

### Modeling

You will need to model the logo with a 2-D mesh of triangles. One approach to creating the mesh would be to get some graph paper, draw the logo and figure out a set of coordinates for the vertices and a set of edges for the triangles that works.  Once you have the coordinates and triangles, just write up a JavaScript arrays in your code containing those numbers. 

Specifically, in the starter code you will want to modify `setupBuffers` and create a buffer to hold the vertex positions. Those coordinates should be sent down to the vertex shader to feed attributes of the type `in vec3`. 

For the color, we would like you to use a color attribute rather than simply setting the color to orange in the fragment shader. You should create a color buffer with one color per vertex. These colors will be of the form $$(R,G,B,1)$$ where the RGB color channels are in the range $$[0,1]$$. The 4th element of a color is the *alpha* channel which indicates transparency. Since our logo is completely opaque we set *alpha*=1 for each color. The colors should feed attributes of the type `in vec4` in the vertex shader.

You should use a *Vertex Array Object (VAO)* to contain the state information for these attributes. The state of both attributes being active should be contained in a single VAO. You activate a VAO by calling `gl.bindVertexArray` before calling `gl.drawArrays`

An example of how all this is done can be found in the HelloAnimation example from [the Feb. 4 lecture](https://illinois-cs418.github.io/schedule).

#### Coordinate System
The WebGL clip coordinate system is the coordinate system vertex positions are assumed to be in when they leave the vertex shader. The view volume is a box centered at $$(0,0,0)$$ in which all visible geometry has coordinates in the range $$[-1,1]$$.
![clip space](/img/clip.png){:width="400px"}
This means that any vertices outside that range will be *clipped* out and not rendered. So, when you design you logo, it should fit in that space. Since you are working in 2D, all of your vertex positions should be specified as $$(X,Y,0)$$ so you are drawing in the $$Z=0$$ plane. If it is easier to work in another coordinate space, you can do so as long as you transform the coordinates appropriately. For example you could work in $$[-100,100]$$ and simply divide by $$100$$ when you type in the vertex coordinates...or your code could do the division.  

WebGL *clip space* is a left-handed coordinate system. If you enable hidden surface removal using the view you see is essentially from the location $$(0,0,-1)$$ looking down the $$Z^+$$ axis. For this MP, since you are working in 2D, you do not necessarily need to enable hidden surface removal.

To enable hidden surface removal in WebGL you call<br/> `gl.enable(gl.DEPTH_TEST);`<br/> at startup and then call <br/> `gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);`<br/> each time you wish to draw a new frame.<br/> 

### Rendering

For this MP, you can render using the `gl.drawArrays` call, with the primitives specified as `gl.TRIANGLES`. Note that this will draw a triangle for each group of three consecutive vertices. For example, 12 vertices create 4 separate triangles. This means that the coordinates of vertices shared by multiple triangles will be repeated in the buffer. If you wish, you can use a different implementation like fans or strips or an indexed mesh...it just has to work. 

### Animation

You will need to write code to change the location of vertices over time to animate your model. Your code should use two different methods for changing the vertices:

1. Use 2 or more affine transformations (such as scaling, rotation, or translation). Use the [glMatrix](https://glmatrix.net/) library to implement these as matrix transformations. These transformations should be applied to the vertices in the vertex shader using a `uniform` variable

2. Implement another motion by directly changing the vertex positions in the vertex buffer. This means you create a new JavaScript array with vertex position. For example, you may have code the does something like this:

~~~ javascript
gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    
// Start with vertex at the origin    
var triangleVertices = [0.0,0.0,0.0];

//Generate a triangle fan around origin
  var radius=0.5
  var z=0.0;
  
  for (i=0;i<numVertices;i++){
      angle = i *  2 * Math.PI / numVertices;
      x=(radius * Math.cos(angle));
      y=(radius * Math.sin(angle));
      
      //add the vertex coordinates to the array
      triangleVertices.push(x+pointOffset[0]);
      triangleVertices.push(y+pointOffset[1]);
      triangleVertices.push(z);
  }
  triangleVertices.push(triangleVertices[3]);
  triangleVertices.push(triangleVertices[4]);
  triangleVertices.push(z); 
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);

~~~
    
Here, the variable `pointOffset` is a global that is updated each frame...so before each time we draw we have to bind the vertex position buffer and call `gl.bufferData` to send the new vertex positions to the GPU.

 The motion for this animation should be something non-uniform that cannot easily be implemented as an affine transformation. For example, make the logo dance like a vertical sine curve. This part of the animation could be data driven using a table of pre-defined vertex positions for the motion. The motion can also be keyframed, so the vertices are linearly interpolated from one keyframe location to a second keyframe location.  When modifying the vertex positions by changing the coordinates in the buffer, make sure you use `gl.DYNAMIC_DRAW` when invoking `gl.bufferData`.

## Example Animation

Here is an example of an animation that uses only an affine trnasformation applied using a `uniform` matrix sent to the vertex shader:

<iframe src="https://illinois-cs418.github.io/Examples/WebGL2/HelloAnimation/HelloAnimation.html" style="border:0px #000000 none;" height="600px" width="600px"></iframe>

<a href="https://illinois-cs418.github.io/Examples/WebGL2/HelloAnimation/HelloAnimation.html" target="_blank">click here to open in a separate window</a>

## Your Own Animation
Implement a second animation of your own design. It should still be simple, but it should be more than just a slightly different shape doing a similar dance. Some possibilities:

+ Two different logos collide...with actual collision detection and response
+ A mosaic in which the vertex positions don’t change but the colors of the pieces do
+ A stick figure walking

It doesn’t have to be complex, but it should be your own work. 

### Modeling

 You can design your mesh for this animation by hand, or you can try out a modeling package like [Blender]((https://www.blender.org/)). Blender has a complex interface, so we would recommend just doing something simple by hand. But, if you do wish to use Blender you would need to get the geometry into your app somehow. We will work on reading files later in the semester, so for now just hard-coding the initial vertex positions would be easiest. If you export your Blender mesh as an `ASCII STL` file, you should be able to copy and paste the coordinates into a JavaScript array suitable for rendering with `gl.drawArrays`.

### Switching Between Animations

You should add a radio to your HTML as described in the [Mozilla HTML Docs here](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio)

An example of how to do this would be:

~~~ html
<p>Select an animation:</p>
<div>
<input type="radio" id="I" name="animation" value="I" checked>
<label for="I">Illinois Logo</label>
</div>
<div>
<input type="radio" id="MyAnimation" name="animation" value="MyAnimation">
<label for="MyAnimation"> Your Animation Name Here</label>
</div>
~~~

To query to see if a button is checked in JavaScript you would do the following:

~~~ javascript
if (document.getElementById("I").checked == true)
        {
            //bind the VAO for the I logo
        }
~~~

Based on which button is checked, you will choose which VAO to bind before calling `gl.drawArrays`. if you use a different shader program for your second animation, you will need to specify which program to use by invoking `gl.useProgram`.

**Be aware that using multiple shader programs requires attention to detail.** The attribute variables may have different names and indices so you need to make sure you use the correct ones when setting up the VAOs. The uniform variables may also have different names and indices and you will need to use the correct ones when calling `gl.uniformMatrix4fv` to send a matrix to the shader program, for example. You are not required to use two different shader programs for this MP.
