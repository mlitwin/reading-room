---
title: Tensor Calculus on Manifolds — Geometry, Mechanics, and Gravity
author: Matthew Litwin
date: 2026-06-23
tags: [mathematics, physics, manifolds, tensors, differential-geometry, classical-mechanics, lagrangian, hamiltonian, general-relativity]
summary: A reference that develops the calculus of smooth manifolds from scratch and carries one tensor formulation from classical mechanics through to general relativity. Part I is the coordinate-free foundation (manifolds, tangent and cotangent spaces, flows, forms, integration, cohomology). Part II is Lagrangian and Hamiltonian mechanics and Noether's theorem, which need no metric. Part III builds tensors, the metric, the connection and curvature, with the sphere as a running example. Part IV joins the two through the kinetic metric, where Newton's law becomes covariant. Part V reaches special relativity, field theory and the stress–energy tensor, the Einstein equations, Schwarzschild, Einstein–Cartan and the Newtonian limit.
---

This is a reference, not a textbook. It develops the calculus of smooth manifolds and carries a single tensor formulation from classical mechanics to general relativity. A reader heading into [Misner–Thorne–Wheeler](https://en.wikipedia.org/wiki/Gravitation_(book)), [Wald](https://en.wikipedia.org/wiki/General_Relativity_(book)) or [Arnold](https://en.wikipedia.org/wiki/Mathematical_Methods_of_Classical_Mechanics) can use it to recover any definition, formula or transformation rule without paging through a thicker book.

**The thread.** Mechanics and gravity use the same tensor calculus, in two stages:

- **Without a metric.** Lagrangian and Hamiltonian mechanics live on the tangent and cotangent bundles of a configuration space, and Noether's theorem is a statement about flows.
- **With a metric.** Adding one identifies kinetic energy with it, so Newton's law becomes $\nabla_{\dot q}\dot q = -\operatorname{grad} V$, free motion becomes geodesic motion, and symmetries become Killing fields. General relativity takes the last step: spacetime is the configuration space, $V = 0$, and gravity is the curvature of the metric.

Flat space, Cartesian coordinates, and slow motion are special cases the general machinery reduces to, and each reduction is noted where it occurs.

**Two languages, two viewpoints.** Tensor calculus has two notations in serious use: the physicist's index notation and the mathematician's coordinate-free notation. It also has two viewpoints: the [embedded picture](note:embedded-manifold), where $M$ sits inside $\mathbb{R}^N$, and the [abstract picture](note:abstract-manifold), where it doesn't. Both run in parallel throughout. A [running example](note:running-example) on the sphere $S^2$ anchors the abstract material: its charts, metric, curvature, geodesics and Killing fields, and a particle and a pendulum moving on it.

**Notation.** The index, sign and typeface conventions, and a table of every symbol (with Greek letters spelled out), are collected on the [notation page](00-notation.md). Index-free tensors are set in bold italic and their components in italic. The [Einstein summation convention](note:einstein-summation) is in force throughout. Underlined terms open a short definition in place, with a link back to the full treatment.

## Part I — Calculus on manifolds

1. [Manifolds](01-manifolds/index.md): charts, smooth maps, tangent and cotangent spaces and bundles; a pointwise-metric aside.
2. [Vector fields and flows](02-vector-fields-and-flows/index.md): vector fields, flows, the Lie bracket, the Lie derivative.
3. [Differential forms](03-differential-forms/index.md): $k$-forms, the wedge product, the exterior derivative, pullback.
4. [Integration](04-integration/index.md): orientation, integration of $n$-forms, Stokes's theorem.
5. [De Rham cohomology](05-de-rham/index.md): closed and exact forms, the Poincaré lemma. *Optional on a first pass.*

## Part II — Mechanics without a metric

6. [Lagrangian mechanics](06-lagrangian-mechanics/index.md): Newton as the flat case, forces as 1-forms, the action, Euler–Lagrange, constraints.
7. [Hamiltonian mechanics](07-hamiltonian-mechanics/index.md): the Legendre transform, phase space, the symplectic form, Poisson brackets, Liouville.
8. [Symmetry and Noether's theorem](08-symmetry-and-noether/index.md): symmetries as flows, the charge $J_\xi$, the classical conservation laws.

## Part III — Geometry

9. [Coordinate systems on the sphere](09-coordinate-systems/index.md): charts, atlases and basis vectors; two charts on $S^2$.
10. [Tensors](10-tensors/index.md): the $(r, s)$ construction, components, the parallel notations.
11. [The metric](11-metric/index.md): signature, raising and lowering, volume, Killing vectors.
12. [Connection and curvature](12-connection-and-curvature/index.md): the covariant derivative, geodesics, torsion, Riemann, geodesic deviation.

## Part IV — Mechanics with a metric

13. [Natural systems](13-natural-systems/index.md): the kinetic metric, covariant Newton, Killing symmetries, the particle and pendulum on $S^2$.

## Part V — Relativity

14. [Special relativity](14-special-relativity/index.md): Minkowski spacetime, four-momentum, the relativistic particle.
15. [Fields and stress–energy](15-fields-and-stress-energy/index.md): Lagrangian field theory, Noether currents, $T_{\mu\nu}$.
16. [General relativity](16-general-relativity/index.md): the Einstein equations, Schwarzschild, Einstein–Cartan, the Newtonian limit.

## Reading paths

- **Mechanics:** chapters 1–3, then Part II, then chapter 11, then Part IV.
- **General relativity:** everything except chapter 5. Part II can be read quickly, but Parts IV and V build on its Euler–Lagrange, Legendre and Noether results.
- **Lookup:** the [notation page](00-notation.md) and the [notes page](17-notes.md), which collects the short definitions behind every underlined term.
