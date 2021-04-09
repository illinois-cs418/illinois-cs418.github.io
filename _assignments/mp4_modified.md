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

### Phong Shading

Coming soon.

### Generating Texture Coordinates
Coming soon.

### Texture Mapping
Coming soon.

### User Interaction Using a Mouse 

Coming soon.



