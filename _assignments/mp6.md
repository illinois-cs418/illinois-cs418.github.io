---
layout: assignment
title: "MP6: (Optional) Shading for Technical Illustration"
index: 10
due: "May 7, 2022 @ 11:59 PM"
material: ~
points: 100
rubric:
  -
    name: Silhouette Rendering 
    points: 50
    description: Render vertices on feature edges with black
  - 
    name: Gooch Shading
    points: 50
    description: Render other vertices using a warm-to-cold color scheme
---

![gooch shading](https://illinois-cs418.github.io/img/gooch1.PNG){:width="800px"}   

## Overview

This is an extra credit assignment that can be used to raise your lowest exam score. The maximum amount of points recovered will be $$30\%$$ of the original points possible on the exam. The percentage of points recovered will calculated by the percentage score of this assignment time $$30\%$$. So, for example, if you score a $$50\%$$ on this assignment you will raise your lowest exam score by $$50\% \times 30\% = 15\%$$. Exam scores will not be raised over $$100\%$$.

##  Non-Photorealistic Shading

One the great advantages of programmable shaders is the ability to express creative rendering styles in code. We have focused on photorealistic shading in this course, but many other styles are possible and used. One of these is referred to as Gooch shading. This style of shading mimics that used for technical illustration, where the central goal is to help people comprehend shape rather than to appear realistic.  

The 1998 SIGGRAPH paper [A Non-Photorealistic Lighting Model For Automatic Technical Illustration](https://users.cs.northwestern.edu/~ago820/SIG98/gooch98.pdf) by Amy Gooch et al. describes the principles behind this approach. The two key elements are rendering objects with silhouette edges and using a cool-to-warm color palette. The difference in appearance between the Phong reflection model and Gooch shading is shown below.

![dino1](https://illinois-cs418.github.io/img/d1.png){:width="400px"}
![dino2](https://illinois-cs418.github.io/img/d2.png){:width="400px"}

In this assignment you will implement Gooch shading in WebGL.

## Starter Code

You should use a copy of the code from [MP4](https://illinois-cs418.github.io/assignments/mp4.html) as the basis for this MP. You can remove the texture mapping code but keep the code the reads in and renders a mesh. Virtually all of the code you write for this MP will be in the vertex shader.  

## Phong Reflection Model

You should allow users to render the mesh using the Phong reflection model. Use Gouraud shading and any diffuse and and ambient color you wish. Use white for specular reflections. You should be able to re-use slightly modified code from [MP4](https://illinois-cs418.github.io/assignments/mp4.html) for this...simply use hardcoded material colors in the vertex shader rather than sampling a texture in the fragment shader.

## User Interface

Your app should allow the user to rotate the mesh around the Y axis. This code should already be in place from MP4. In addition, your webpage should include a radio button the allows the user to switch between the Phong reflection model and Gooch shading. 

An example of how to do this would be:

~~~ html
<div>
<input type="checkbox" id="gooch" name="gooch" checked>
<label for="gooch">Enable Gooch Shading</label>
</div>
~~~

To query to see if a box is checked in JavaScript you would do the following:

~~~ javascript
if (document.getElementById("gooch").checked == true)
        {
            //update a uniform variable to let 
            //vertex shader know whether or not to us Gooch shading
        }
~~~

You can use a GLSL `uniform bool`  or `uniform int` in the vertex shader to communicate whether or not the shader should use Gooch shading. 

## Gooch Shading

The Gooch Shading technique requires rendering silhouette edges in black and using a particular shading scheme for the surface. To quote the Gooch paper: 

> matte objects are shaded with intensities far from black or white with warmth or coolness of color indicative of surface normal; a single light source provides white highlights.

We will implement each of these capabilities in the vertex shader and simply pass a final color to the fragment shader  

### Silhouette Edges

Traditionally, silhouette edges in a mesh are defined as edges shared by a forward-facing triangle and backwards facing triangle. This cannot be easily detected in the vertex shader but we can try to approximate finding vertices on a such an edge by using the formula $$(N_v \cdot (V-E))<\epsilon$$

Here we have:

+ $$N_v$$ is the vertex normal
+ $$V$$ is the vertex position
+ $$E$$ is the eye (viewer) position
+ $$\epsilon$$ is a small threshold value you define...

If the above inequality holds at the vertex, the normal is close to making a $$90$$ degree angle with the vector from the viewer...which means the vertex is on some sort of silhouette or feature edge. You will probably need to experiment to find a good value for $$\epsilon$$. These computations are probbaly most easily done in the view coordinate system.

When the inequality holds, the color generated for the vertex should be black $$I_{rgba}=(0,0,0,1)$$. If the inequality does not hold, you should use the shading method in the next section.

### Cool-to-Warm Colors

The shading model used by Gooch et al. is $$I_{rgba}=(\frac{1+\vec{l} \cdot \vec{n}}{2})k_{cool} +(1-\frac{1+\vec{l} \cdot \vec{n}}{2})k_{warm}$$

Here we have:

+ $$\vec{l}$$ is the unit-length light direction (as in the Phong reflection model)
+ $$\vec{n}$$ is the unit-length surface normal
+ The color $$k_{cool}=k_{blue}+\alpha k_d$$
+ The color $$k_{warm}=k_{yellow}+\beta k_d$$ 
+ $$k_{blue} = (0,0,b,1)$$ for $$b \in [0,1]$$
+ $$k_{yellow} = (y,y,0,1)$$ for $$y \in [0,1]$$
+ $$\alpha$$ and $$\beta$$ are typically in $$[0,1]$$ found experimentally
+ $$k_d$$ is the original surface diffuse and ambient material color

You can use $$I_{rgba}$$ as the final color for the vertex or add in the specular component of the Phong model...see which one looks best.

Here is an example rendering with $$b = 0.55, y = 0.3,  \alpha = 0,25, \beta = 0.5$$ The different values of $$b$$ and $$y$$ determine the strength of the overall temperature shift, where as $$\alpha$$ and $$\beta$$ determine the prominence of the object color, and the strength of the luminance shift.

![claw](https://illinois-cs418.github.io/img/claw.png){:width="400px"}  

### Test Case

The famous Stanford Bunny mesh in the OBJ file format can be downloaded from this link: [bunny.obj](https://graphics.stanford.edu/~mdfisher/Data/Meshes/bunny.obj).

Your code should produce something similar to this image:

![bunny](https://illinois-cs418.github.io/img/Bunny_With_Gooch_Shading.png){:width="400px"}   

Obviously, the view and lighting and choice of colors will produce some differences...that's fine. It should just be similar.







