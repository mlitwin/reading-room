---
title: Coordinate systems on the sphere
---

A chart parametrizes a piece of a manifold by an open set of $\mathbb{R}^n$, and calculus on $\mathbb{R}^n$ pulls back through it. Most of the technicalities of tensor calculus exist because the chart is a *choice*: different charts give different component arrays for the same object, and the transformation rules between them are what make a tensor a tensor.

This chapter makes that concrete on $S^2$ with the round metric. Two charts carry most of the work: standard spherical coordinates, and a *skew* variant whose longitudes are sheared by an amount that varies with latitude. Their bases differ at every point, orthogonal in one and not in the other, which makes coordinate dependence easy to see.

Seven pages:

1. [The sphere and two charts](01-the-sphere-and-two-charts.md): the surface, its round metric, and the two parametrizations side by side.
2. [Standard coordinates](02-standard-coordinates.md): basis vectors as functions of position, the dual basis.
3. [Skew coordinates](03-skew-coordinates.md): the same constructions with a non-orthogonal basis.
4. [Changing charts](04-changing-charts.md): the Jacobian as the bridge; what changes and what doesn't.
5. [The stereographic chart](05-the-stereographic-chart.md): a chart through the poles; a vector field and a covector field in two charts.
6. [The round metric](06-the-round-metric.md): $g_{\mu\nu}$ in all three charts, raising and lowering.
7. [A $(1, 1)$-tensor on the sphere](07-a-tensor-on-the-sphere.md): rotation by $90^\circ$ as a tensor field.

The standard chart is the working chart in the chapters that follow. The skew chart returns in the "on the sphere" pages, where the contrast with the standard calculation shows what is intrinsic.

**Metric-free:** charts, bases, Jacobians and the transformation law (pages 2–5, apart from lengths and angles).

## Notation

| Symbol | Meaning |
|---|---|
| $\Phi$ (Phi) | parametrization $\Phi = \varphi^{-1}$ |
| $X, Y, Z$ | Cartesian coordinates of the ambient $\mathbb{R}^3$ |
| $\theta$ (theta), $\varphi$ (phi) | polar angle, azimuth (standard chart) |
| $\tilde\theta, \tilde\varphi$ | skew chart, $\tilde\varphi = \varphi + \alpha\cos\theta$ |
| $\alpha$ (alpha) | skew-chart shear, fixed at $\pi/8$ |
| $\theta_0, \varphi_0$ | sample point, $(13\pi/32,\ 29\pi/32)$ |
| $(x, y)$; $\psi_S$ (psi), $\Phi_S$ | stereographic coordinates; their chart and parametrization |
| $J$ | Jacobian of a chart change |
| $\tens{J}$ | rotation by $90^\circ$, an almost complex structure on $S^2$ |
