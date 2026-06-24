---
title: Coordinate systems on the sphere
---

A coordinate chart is a parametrization of a piece of a manifold by an open set of $\mathbb{R}^n$. Calculus is well-defined on $\mathbb{R}^n$; pulling that machinery back through a chart gives calculus on the manifold. Most of the technicalities of tensor calculus exist because the chart is a *choice* — different choices produce different component arrays for the same intrinsic object, and the transformation rules between them are what make a tensor a tensor.

This section sets up that picture with two concrete charts on the two-sphere $S^2$ as a running example. The standard lat/long chart and a *skew* variant in which the longitude lines are rotated by a fixed angle around the $Z$-axis. The two charts cover the same surface; their basis vectors at a point are different; the angle between those bases is $\pi/2$ in one chart and not $\pi/2$ in the other. The contrast between them is the easiest setting in which to see what coordinate-dependence actually does.

Five pages:

1. [The sphere and two charts](01-the-sphere-and-two-charts.md) — the underlying surface and the two parametrizations side by side.
2. [Standard coordinates](02-standard-coordinates.md) — the lat/long chart in detail, basis vectors as a function of position.
3. [Skew coordinates](03-skew-coordinates.md) — the tilted-longitude chart, the same constructions, now with non-orthogonal basis.
4. [Changing charts](04-changing-charts.md) — the Jacobian as the bridge; what changes and what doesn't.
5. [Vectors and covectors on the sphere](05-vectors-and-covectors-on-the-sphere.md) — the [Part I](../01-manifolds/index.md) tangent and cotangent spaces made concrete, with the stereographic chart as a third example.

The standard chart returns as the primary working chart in the chapters that follow. The skew chart shows up in the "on the sphere" pages of subsequent chapters, where the contrast with the standard calculation highlights what's intrinsic.
