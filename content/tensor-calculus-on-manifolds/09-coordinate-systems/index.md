---
title: Coordinate systems on the sphere
---

A chart parametrizes a piece of a manifold by an open set of $\mathbb{R}^n$, and calculus on $\mathbb{R}^n$ pulls back through it. Most of the technicalities of tensor calculus exist because the chart is a *choice*: different charts give different component arrays for the same object, and the transformation rules between them are what make a tensor a tensor.

This chapter makes that concrete with two charts on $S^2$: standard spherical coordinates, and a *skew* variant whose longitudes are sheared by an amount that varies with latitude. The bases of the two charts differ at every point, orthogonal in one and not in the other, which makes coordinate-dependence easy to see.

Five pages:

1. [The sphere and two charts](01-the-sphere-and-two-charts.md) — the underlying surface and the two parametrizations side by side.
2. [Standard coordinates](02-standard-coordinates.md) — the spherical chart in detail, basis vectors as a function of position.
3. [Skew coordinates](03-skew-coordinates.md) — the tilted-longitude chart, the same constructions, now with non-orthogonal basis.
4. [Changing charts](04-changing-charts.md) — the Jacobian as the bridge; what changes and what doesn't.
5. [Vectors and covectors on the sphere](05-vectors-and-covectors-on-the-sphere.md) — the [Part I](../01-manifolds/index.md) tangent and cotangent spaces made concrete, with the stereographic chart as a third example.

The standard chart returns as the primary working chart in the chapters that follow. The skew chart shows up in the "on the sphere" pages of subsequent chapters, where the contrast with the standard calculation highlights what's intrinsic.
