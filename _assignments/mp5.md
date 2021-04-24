---
layout: assignment
title: "MP5: A Simple Physics Engine"
index: 10
due: "May 8, 2021 @ 11:59 PM"
material: ~
points: 100
rubric:
  -
    name: Forces
    points: 20
    description: Implement gravity and drag
  - 
    name: Collision Detection
    points: 20
    description: Implement sphere-wall collision detection and resolve the collision in a physical realistic manner.
  -
    name: Spheres
    points: 20
    description: Generate spheres of different sizes and colors.
  - 
    name: Euler integration
    points: 20
    description: Implement a physics engine the uses Euler integration to update velocity and position.
  - 
    name: Shading, Lighting, and View
    points: 10
    description: Shading should be done in the fragment shader and use either the Phong model. Light and camera setup should provide a good view of the scene. 
  - 
    name: User interface
    points: 10
    description: Have an interface which allows users to generate more spheres, maybe with a button press. Also allow users to remove all the spheres with a button press.
---

![spheres](http://illinois-cs418.github.io/img/mp4.png){:height="400px" width="400px"}   

### Overview

For your final programming assignment, you  will write a simple particle system using WebGL. Particle systems are typically used to model fine-grained physical effects like fire, smoke, and water. We will do something simpler and just render a system of bouncing spheres in 3D.

Your program will render a set of spheres bouncing around an invisible 3D box. You could use an axis aligned box stretching from  $$(-k,-k,-k)$$ to $$(k,k,k)$$ for example, where $$k$$ is a scale you choose. It's best to work imagine working in meters, as it will make debugging the physics easier.

When a sphere hits one of the walls in the box, it should reflect in physically realistic manner. 

### Starter Code

The following code renders a single stationary sphere. You can adapt it as the basis for your MP.

+ [MP5.html](https://github.com/illinois-cs418/illinois-cs418.github.io/raw/master/Examples/MP5/MP5.html)
+ [MP5.js](https://github.com/illinois-cs418/illinois-cs418.github.io/raw/master/Examples/MP5/MP5.js)
+ [Sphere.js](https://github.com/illinois-cs418/illinois-cs418.github.io/raw/master/Examples/MP5/Sphere.js)
+ [gl-matrix-min.js](https://github.com/illinois-cs418/illinois-cs418.github.io/raw/master/Examples/MP5/gl-matrix-min.js)

### Particles

You should keep an array or list of particles. Each particle should have the following information associated with it:

+ Position
+ Velocity
+ Radius
+ Color
+ Mass

How you represent this information is up to you, but `glMatrix.vec3` is a convenient choice for the three-dimensional physical quantities of position, and velocity. 

#### Instancing 

You only need to generate one sphere mesh...you simply draw that mesh in multiple different spots each frame...once for each particle.
You can change  the location and size of the sphere using a modeling transform. This technique is called _instancing_.

The color can be sent as `uniform` to the fragment shader and used for the $$k_{ambient}$$ and $$k_{diffuse}$$ material colors in the shading calculation using either the Phong or Blinn-Phong model.  You should use Phong shading (i.e. per-fragment shading).

#### Creation

You should allow users to spawn $$n$$ spheres using a button press or mouse click. You can choose $$n$$ to be whatever number you wish...have it be more than $$1$$. The spheres should created with the following initial state:

+ Random position in the box.
+ Semi-random velocity...choose some reasonable magnitude that produces visually appealing results. The direction can be random.
+ Randomly generated color...you can choose from a set of 3 more colors or just randomly generate an $$(r,g,b)$$ value.
+ Semi-random radius...choose something in a range that produces visually appealing results
+ Reasonable mass...you can use a uniform mass if you wish

### Physics

After rendering a frame showing the current position of the spheres, you will need to update the position and velocity of each sphere:

+ Compute the acceleration using the force of **gravity**. You can use a value other than $$10\frac{m}{s^2}$$ but it should produce results that look physically plausible.
+ Update the velocity using the acceleration and Euler integration and **drag**.
+ Update the position using the current velocity and Euler integration

When a sphere hits the floor and the change in position in the next frame falls below some threshold $\epsilon$ you should set the velocity to $$(0,0,0)$$ and clamp the sphere to the floor and stop moving the sphere. You may want to add a Boolean flag to your particle representation that indicates you should not update the particle anymore

#### Reference

For details on how to implement your physics engine consult the course materials:

+ A Physics Engine [Video](https://classtranscribe.illinois.edu/video?id=4800e988-4f5d-4559-a3bc-beae3f3cfd3d&from=sharedlink)&nbsp;[PDF](https://github.com/illinois-cs418/cs418CourseMaterial/raw/master/Lectures/Fall2020/418-Physics.pdf)
+ Collision Detection [Video](https://classtranscribe.illinois.edu/video?id=9216122a-bd3b-4641-ab4f-8080949c624b&from=sharedlink)&nbsp;[PDF](https://github.com/illinois-cs418/cs418CourseMaterial/raw/master/Lectures/Fall2020/418-Collide.pdf) 
+ Euler's Method [Video](https://classtranscribe.illinois.edu/video?id=bd611499-ac64-4766-98c2-c3eeaebb16e2&from=sharedlink)&nbsp;[PDF](https://github.com/illinois-cs418/cs418CourseMaterial/raw/master/Lectures/Fall2020/418-EulersMethod.pdf)

#### Timesteps

You can use a uniform timestep $$\Delta t$$ meaning each new frame is a timestep of size $$\Delta t$$ or you can use wall-clock time. To use wall-clock time, your callback function to `requestAnimationFram` should include a single parameter of type [`DOMHighResTimeStamp`.](https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp) You can use this timestamp to compute $$\Delta t$$ as how much actual time has passed. You may need to scale this elapsed time by some factor to achieve results you are happy with.

### Collisions 

The only collisions you need to check for are between your spheres and the walls.

#### Detection

If you are using an axis-aligned box with an extent of $$(-k,-k,-k)$$ to $$(k,k,k)$$ you can detect a collision with a wall by computing the new position $$(p_x,p_y,p_z)$$ of a particle and checking if $$\|p_i \pm r\| \geq k$$ for any of the coordinates.  Here, $$r$$ is the radius of the particle. Your check should consider each wall, not just stop with the first hit you find. You should pick the wall with the earliest hit in the event that the particle's final position is beyond more than $$1$$ wall.

As an example, suppose you determine that the coordinate $$p_x + r \geq k$$. We can construct a ray $$o + t\vec{v}$$ where $$o$$ is the starting position of the particle this frame and $$\vec{v}$$ is the velocity. We can find the time $$t$$ at which the particle hits the wall by solving $$t=\frac{(k-r)-o_x}{\vec{v_x}}$$. Here, $$o_x$$ and $$\vec{v_x}$$ are the $$x$$ coordinates of those components. Which coordinate you use and the sign of $$r$$ in the numerator will depend on the particular collision you are resolving.

Once you know the value $$t$$ at which the earliest hit happened, you can compute the position of the particle when the hit happened as $$p = o + t\vec{v} $$.  

#### Resolution

![img](http://bocilmania.com/wp-content/uploads/2018/04/intro.png)

When a sphere collides with a wall, you need to compute the point of collision and set the particle position to that point. 

You should calculate a new direction for the velocity. Let $$\vec{v_1}$$ be the incoming velocity of the particle and $$\vec{n}$$ be the unit normal of the wall. The new velocity $$\vec{v_2}$$ is found using $$\vec{v_2}=\vec{v_1}-2(\vec{v_1} \cdot \vec{n})\vec{n}$$. 

The magnitude of the new velocity should be $$\left\|\vec{v_2}\right\|=c\left\|\vec{v_1}\right\|$$. Where $$c\in(0,1)$$ is constant that you choose.

To be technically correct, you should really complete the current timestep with the new velocity, but for this MP you can simply leave the particle in the resolution state and use the new velocity next frame.  

### User Interface

Your app should have two controls:

+ A control (button or mouse-click) to spawn spheres.

+ A control (button or mouse-click) to remove all spheres

Optionally, you can controls to adjust the parameters of the simulation as well (e.g. acceleration due to gravity).

You should include text on your webpage indicating what these controls are and how to use them.





