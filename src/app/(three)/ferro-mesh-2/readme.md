# water-2

Render pipeline:

## water-particles

Particles used to displace the pyramid surface and simulate a water-like effect.

When they are near their origin, they will not displce the water, when they are displaced, they will act as metaballs shifting the water surface.

They will be rendered as normals projected on the XY plane.

## pyramid-surface (raymarching)

This material will create a pyramid with a water-like surface.

It will react to user interaction and can be broken by the particles.

## Flow map

Height displacement calculation. It will be displaced by the mouse.
It will also output normals using derivatives.

It will also recieve the particles so that they can displace the water surface.

## Raymarching water
