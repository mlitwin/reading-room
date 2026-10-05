---
title: The sphere and two charts
---

## The surface

The two-sphere of radius $R$ is the subset
$$S^2_R = \{(X, Y, Z) \in \mathbb{R}^3 : X^2 + Y^2 + Z^2 = R^2\}.$$
Throughout this book we take $R = 1$ unless stated otherwise. The sphere is a smooth two-dimensional submanifold of $\mathbb{R}^3$ — small enough to be tractable, rich enough that almost every phenomenon in tensor calculus shows up on it non-trivially.

In the embedded picture, $T_p S^2$ is the plane in $\mathbb{R}^3$ tangent to the sphere at $p$. Intrinsically, the sphere is a closed orientable surface, of constant curvature once given the round metric; the constructions of this book work intrinsically and reduce to the embedded picture wherever both apply.

## What a chart is

A **chart** on a smooth manifold $M$ is a smooth invertible map
$$\Phi: U \to V,$$
where $U \subseteq \mathbb{R}^n$ is open and $V \subseteq M$ is an open subset. The inverse $\Phi^{-1}: V \to U$ assigns coordinates to points; the components are the **coordinate functions** $x^\mu := \pi_\mu \circ \Phi^{-1}$. ([Part I](../01-manifolds/01-charts-and-smooth-maps.md) defined a chart as the coordinate map $\varphi: V \to \mathbb{R}^n$; this chapter works with the parametrization $\Phi = \varphi^{-1}$, the convenient direction for computing on the sphere. Same data, opposite arrow.)

A single chart almost never covers all of $M$. The sphere needs at least two: it is compact, and no open subset of $\mathbb{R}^2$ is. (The angular chart below does worse, missing both poles and a seam.) Manifolds are described by an **atlas** of charts whose overlaps glue together smoothly (the **transition maps**).

For tensor calculus, the choice of atlas mostly doesn't matter — every object we introduce is **chart-independent** in the sense that it has an intrinsic definition. What *does* depend on the chart is the **component representation**: the array of numbers a tensor has in a given chart. The transformation rule between charts is what makes those arrays into a tensor.

## Two charts on $S^2$

We use two charts throughout the book, each covering the sphere minus the poles and one seam.

**Standard chart** $\Phi$. The familiar lat/long parametrization:
$$\Phi(\theta, \varphi) = (\sin\theta\cos\varphi, \; \sin\theta\sin\varphi, \; \cos\theta).$$
The "north pole" $\theta = 0$ aligns with the $+Z$ axis; the equator $\theta = \pi/2$ lies in the $XY$-plane; the prime meridian $\varphi = 0$ is the half of the $XZ$-plane with $X > 0$. The chart misses the two poles and the seam at $\varphi = 0$.

![Standard sphere with the prime meridian and equator highlighted, with tangent basis arrows at the sample point](../figures/sphere-standard.svg)

**Skew chart** $\tilde\Phi$. Keep the standard polar angle and shear the azimuth by an amount that depends on the polar angle:
$$\tilde\theta := \theta, \qquad \tilde\varphi := \varphi + \alpha\cos\theta,$$
giving the embedded parametrization
$$\tilde\Phi(\tilde\theta, \tilde\varphi) = \Phi\bigl(\tilde\theta,\, \tilde\varphi - \alpha\cos\tilde\theta\bigr).$$
The shift is largest at the poles and zero at the equator, so the latitude circles are unchanged (they sit at constant $\theta = \tilde\theta$) but the longitude curves spiral by $\alpha$ between equator and pole. In this book we fix $\alpha = \pi/8 \approx 22.5°$ for visibility. [Page 3](03-skew-coordinates.md) develops this chart in full.

![Sphere with the skewed longitude grid; latitudes still horizontal, longitudes tilted by π/8](../figures/sphere-skew.svg)

The two diagrams show the same surface with the same equator ($\theta = \pi/2$, in green). The skew longitudes $\tilde\varphi = \text{const}$ are the curves $\varphi = \text{const} - \alpha\cos\theta$ — sheared, and no longer great circles.

The colored arrows mark the basis-vector directions at a fixed **sample point**
$$p = \Phi(\theta_0, \varphi_0) \quad\text{with } \theta_0 = \tfrac{13\pi}{32}, \ \varphi_0 = \tfrac{29\pi}{32}.$$
The yellow arc is along the longitude (the direction of increasing $\theta$ for the chart in question); the blue arc is along the latitude (the direction of increasing $\varphi$). In the standard chart these two arcs meet at $90°$ at every point. In the skew chart they don't — at the sample point the angle between them is visibly less than $90°$. Pages [2](02-standard-coordinates.md) and [3](03-skew-coordinates.md) work out the basis vectors explicitly.

## What the contrast is meant to show

Three things become visible by comparing the charts:

1. **A choice of chart picks a basis at every point.** Each chart has its own coordinate basis $\partial_\theta, \partial_\varphi$ in the tangent space at $p$. The basis is part of the chart, not part of the manifold.
2. **The angle between basis vectors is not invariant.** It depends on the chart. Where the basis is non-orthogonal, components of the metric pick up off-diagonal entries; the dual basis is no longer parallel to the coordinate basis; and more Christoffel symbols are non-zero.
3. **The geometry doesn't care.** The geodesics, the curvature, the area form — all are the same intrinsic objects in both charts. Their *components* differ; their intrinsic descriptions do not. This invariance is exactly what the tensor transformation law enforces.

The next pages develop these three observations concretely.
