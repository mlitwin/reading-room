---
title: Manifolds
---

A **smooth manifold** is a topological space that locally looks like $\mathbb{R}^n$ and on which one can do calculus. Three pages: the manifold itself, the tangent vectors at a point, and the covectors that pair with them. Everything in this chapter is metric-free; the metric that identifies vectors with covectors arrives in [chapter 3](../03-metric/index.md), once tensors are available to define it.

**Where this lands in GR.** Spacetime is a smooth $4$-manifold, and charts are the coordinate systems of physics. No single chart covers even the sphere, let alone a black-hole spacetime, so GR must be built chart-independently from the start.

## Notation

| Symbol | Meaning |
|---|---|
| $M, N$ | smooth manifolds; $n = \dim M$ |
| $p, q$ | points of $M$ (Part I). In mechanics $q$ is a configuration and $p$ a momentum |
| $U, V$ | open sets |
| $(U, \varphi)$ — $\varphi$ (phi) | chart; local coordinates $x^i = \varphi^i$ |
| $F, G$ | smooth maps; $dF_p$ or $F_*$ differential (pushforward), $F^*$ pullback |
| $\gamma$ (gamma) | curve, with velocity $\dot\gamma$ |
| $\lambda$ (lambda) | curve parameter (affine for geodesics) |
| $f, g, h$ | smooth functions (italic $g$ is a function; the metric is $\tens{g}$) |
| $C^\infty(M)$, $\mathfrak{X}(M)$, $\Omega^k(M)$ | smooth functions, vector fields, $k$-forms; $\Omega^k_c$ compactly supported |
| $\mathbb{R}^n$, $\mathbb{H}^n$, $S^n$, $T^n$ | Euclidean space, half-space, sphere, torus |
| $T_p M$, $T^*_p M$ | [tangent and cotangent spaces](note:tangent-space) at $p$ |
| $TM$, $T^*M$; $\pi$ (pi) | tangent and cotangent bundles; bundle projection |
| $\tens{v}, \tens{w}$ | tangent vectors, components $v^i$ |
| $\tens{\omega}, \tens{\eta}$ (omega, eta) | covectors and forms, components $\omega_i$ |
| $\partial_i$, $dx^i$ | coordinate basis and dual basis |
| $\delta^i_j$ (delta) | Kronecker delta. $\delta q$ is a variation (mechanics) |
| $d$ | [differential, exterior derivative](note:exterior-derivative) |
