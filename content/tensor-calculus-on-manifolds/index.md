---
title: Tensor Calculus on Manifolds, with an Eye to General Relativity
author: Matthew Litwin
date: 2026-06-23
tags: [mathematics, physics, manifolds, tensors, differential-geometry, general-relativity]
summary: A reference that develops the calculus of smooth manifolds from scratch and carries it through to general relativity. Part I is the coordinate-free foundation — manifolds, tangent and cotangent spaces, vector fields, differential forms, integration, de Rham cohomology. Part II builds tensors, the metric, the affine connection, and curvature on top of it, with the sphere as a running example and flat spacetime recovered as the special case, ending at the Einstein equations, Schwarzschild, and Einstein–Cartan.
---

This is a reference, not a textbook. It develops the calculus of smooth manifolds in a form a reader heading into [Misner–Thorne–Wheeler](https://en.wikipedia.org/wiki/Gravitation_(book)) or [Wald](https://en.wikipedia.org/wiki/General_Relativity_(book)) can use to recover any definition, formula, or transformation rule without paging through a thicker book.

The book is in two parts. **Part I** is the abstract foundation: smooth manifolds, the tangent and cotangent spaces, vector fields and flows, differential forms, integration and Stokes's theorem, de Rham cohomology — coordinate-free, dimension- and signature-agnostic, no metric assumed. **Part II** puts that machinery to work for general relativity: the $(r,s)$-tensor construction, the metric, the affine connection and curvature, and finally the Einstein equations. Tensor calculus has two languages in serious use — the physicist's index notation and the mathematician's coordinate-free notation — and two viewpoints — the [embedded picture](note:embedded-manifold) where $M$ sits inside $\mathbb{R}^N$ and the [abstract picture](note:abstract-manifold) where it doesn't; both run in parallel throughout, with a [running example](note:running-example) on the sphere $S^2$ anchoring the abstract material to a concrete computation. Flat space is the special case the curved machinery specializes to, not a separate theory.

A companion review, [`classical-mechanics`](../classical-mechanics/index.md), develops the Lagrangian and Hamiltonian formalisms and Noether's theorem; this book references it where mechanics and geometry meet — most directly at [Killing vectors](note:killing-vector), where the conserved quantities of geodesic motion are the geodesic instance of Noether's theorem.

Notation throughout: $M, N$ are smooth manifolds; $p \in M$; $T_p M$ is the tangent space at $p$ with coordinate basis $\partial_i := \partial/\partial x^i$, and $T^*_p M$ the cotangent space with dual basis $dx^i$; $\Omega^k(M)$ is the space of smooth $k$-forms; $X, Y, Z$ are vector fields; $\omega, \eta$ are forms. In the GR chapters, Greek indices $\mu, \nu, \rho, \sigma$ range over spacetime dimensions $0,1,2,3$ and Latin indices $i, j, k$ over spatial dimensions $1,2,3$; the metric signature is $(-,+,+,+)$ when Lorentzian. The [Einstein summation convention](note:einstein-summation) is in force throughout: any index appearing once up and once down in the same expression is summed.

## Part I — Calculus on manifolds

1. [Manifolds](01-manifolds/index.md) — charts, smooth maps, tangent and cotangent spaces.
2. [Vector fields and flows](02-vector-fields-and-flows/index.md) — vector fields, flows, Lie bracket, Lie derivative.
3. [Differential forms](03-differential-forms/index.md) — $k$-forms, the wedge product, the exterior derivative, pullback.
4. [Integration](04-integration/index.md) — orientation, integration of $n$-forms, Stokes's theorem.
5. [De Rham cohomology](05-de-rham/index.md) — closed and exact forms, the Poincaré lemma.

## Part II — Tensors and general relativity

6. [Coordinate systems on the sphere](06-coordinate-systems/index.md) — chart, atlas, basis vectors; two charts on $S^2$ as the running example.
7. [Tensors](07-tensors/index.md) — the $(r, s)$ construction, components, and the parallel notations.
8. [The metric](08-metric/index.md) — what the metric does, raising and lowering, Riemannian vs Lorentzian.
9. [Connection and curvature](09-connection-and-curvature/index.md) — affine connections, the covariant derivative, Riemann and torsion.
10. [General relativity](10-general-relativity/index.md) — the Einstein equations, Schwarzschild, Einstein–Cartan.

A [notes page](11-notes.md) collects supplementary definitions for terms the book uses without expanding.
