---
title: Tensor Calculus on Manifolds — Geometry, Mechanics, and Gravity
author: Matthew Litwin
date: 2026-06-23
tags: [mathematics, physics, manifolds, tensors, differential-geometry, classical-mechanics, lagrangian, hamiltonian, general-relativity]
summary: A reference that develops the calculus of smooth manifolds from scratch and carries one tensor formulation from classical mechanics through to general relativity. Part I builds manifolds, tensors and the metric, with the sphere as a running example. Part II is calculus on a manifold with a metric — flows, forms, integration, the Levi-Civita connection and curvature — marking what holds without one. Part III is Lagrangian and Hamiltonian mechanics with kinetic energy as the metric, so Newton's law is covariant and symmetries are Killing fields. Part IV reaches special relativity, field theory and the stress–energy tensor, the Einstein equations, Schwarzschild, Einstein–Cartan, the Newtonian limit and Newton–Cartan gravity.
---

This is a reference, not a textbook. It develops the calculus of smooth manifolds and carries a single tensor formulation from classical mechanics to general relativity. A reader heading into [Misner–Thorne–Wheeler](https://en.wikipedia.org/wiki/Gravitation_(book)), [Wald](https://en.wikipedia.org/wiki/General_Relativity_(book)) or [Arnold](https://en.wikipedia.org/wiki/Mathematical_Methods_of_Classical_Mechanics) can use it to recover any definition, formula or transformation rule without paging through a thicker book.

**The thread.** Mechanics and gravity use the same geometry: a manifold with a metric. Kinetic energy *is* a metric on configuration space. Newton's law becomes $\nabla_{\dot q}\dot q = -\operatorname{grad} V$, free motion becomes geodesic motion, and symmetries become Killing fields. General relativity takes the last step: spacetime is the configuration space, $V = 0$, and gravity is the curvature of the metric. Flat space, Cartesian coordinates and slow motion are special cases the general machinery reduces to, and each reduction is noted where it occurs.

**The metric is standing structure.** It arrives in chapter 3 and is assumed from then on. Much of the theory needs less, and a paragraph headed **Without a metric** says so wherever that matters; each chapter index lists its metric-free results.

| Needs only the manifold | Needs the metric $\tens{g}$ |
|---|---|
| vectors, covectors, tensors | lengths, angles, causal type |
| flows, Lie bracket, Lie derivative | $\flat$, $\sharp$, gradient, divergence |
| forms, $d$, integration, Stokes, de Rham | volume form, Hodge star |
| affine connections, geodesics, torsion, Riemann | Levi-Civita, Killing fields, sectional curvature |
| Euler–Lagrange, Hamilton's equations, symplectic form, Noether | kinetic metric, covariant Newton, Einstein equations |

[Newton–Cartan gravity](15-general-relativity/05-newton-cartan.md) is the worked case of the left column: gravity as the curvature of a connection, with no spacetime metric.

**Two languages, two viewpoints.** Tensor calculus has two notations in serious use: the physicist's index notation and the mathematician's coordinate-free notation. It also has two viewpoints: the [embedded picture](note:embedded-manifold), where $M$ sits inside $\mathbb{R}^N$, and the [abstract picture](note:abstract-manifold), where it doesn't. Both run in parallel throughout. A [running example](note:running-example) on the sphere $S^2$ anchors the abstract material: its charts, metric, curvature, geodesics and Killing fields, and a particle and a pendulum moving on it.

**Notation.** The [notation page](00-notation.md) collects the conventions every chapter uses: index families, summation, signature and typefaces, with the Greek alphabet spelled out. Conventions with a narrower reach (curvature signs, form components, the symplectic sign) are stated in the index of the chapter that introduces them, with a table of that chapter's symbols. Underlined terms open a short definition in place, with a link back to the full treatment.

## Part I — Manifolds, tensors and the metric

1. [Manifolds](01-manifolds/index.md): charts, smooth maps, tangent and cotangent spaces and bundles.
2. [Tensors](02-tensors/index.md): the $(r, s)$ construction, components and the transformation law, the two notations.
3. [The metric](03-metric/index.md): signature, causal structure, lengths, induced metrics, raising and lowering.
4. [Coordinate systems on the sphere](04-coordinate-systems/index.md): three charts on $S^2$, bases, Jacobians, the round metric.

## Part II — Calculus on manifolds

5. [Vector fields and flows](05-vector-fields-and-flows/index.md): flows, the Lie bracket, the Lie derivative, isometries.
6. [Differential forms](06-differential-forms/index.md): $k$-forms, the wedge product, the exterior derivative, Cartan's formula.
7. [Integration](07-integration/index.md): orientation, the volume form and Hodge star, Stokes's and the divergence theorem.
8. [Connection and curvature](08-connection-and-curvature/index.md): Levi-Civita, geodesics, Killing vectors, torsion, Riemann, geodesic deviation.
9. [De Rham cohomology](09-de-rham/index.md): closed and exact forms, the Poincaré lemma. *Optional on a first pass.*

## Part III — Mechanics

10. [Lagrangian mechanics](10-lagrangian-mechanics/index.md): Newton as the flat case, the kinetic metric, Euler–Lagrange, covariant Newton, constraints as induced metrics.
11. [Hamiltonian mechanics](11-hamiltonian-mechanics/index.md): the Legendre transform as $\flat$, phase space, the symplectic form, Poisson brackets, Liouville.
12. [Symmetry and Noether's theorem](12-symmetry-and-noether/index.md): the charge $J_\xi$, Killing symmetries, the particle and pendulum on $S^2$, the rigid body.

## Part IV — Relativity

13. [Special relativity](13-special-relativity/index.md): Minkowski spacetime, four-momentum, the relativistic particle.
14. [Fields and stress–energy](14-fields-and-stress-energy/index.md): Lagrangian field theory, Noether currents, $T_{\mu\nu}$.
15. [General relativity](15-general-relativity/index.md): the Einstein equations, Schwarzschild, Einstein–Cartan, the Newtonian limit, Newton–Cartan gravity.

## Reading paths

- **Mechanics:** chapters 1–3 and 5, pages 1–3 of chapter 8, then Part III. Chapter 6 is needed for the symplectic form.
- **General relativity:** everything except chapter 9. Part III can be read quickly, but Part IV builds on its Euler–Lagrange, Legendre and Noether results.
- **Lookup:** the [notation page](00-notation.md), the chapter indexes, and the [notes page](16-notes.md), which collects the short definitions behind every underlined term.
