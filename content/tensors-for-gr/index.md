---
title: Tensors for General Relativity
author: Matthew Litwin
date: 2026-05-21
tags: [mathematics, physics, tensors, general-relativity, differential-geometry]
summary: A comprehensive introduction to tensors for a reader with multivariable calculus and linear algebra who wants to be able to read a general relativity textbook. Embedded and abstract views in parallel; index notation and coordinate-free notation in parallel; the sphere as a running example; the affine connection given its own treatment; GR with and without torsion.
---

This is a reference, not a textbook. It develops tensors from scratch in a form that a reader heading into [Misner–Thorne–Wheeler](https://en.wikipedia.org/wiki/Gravitation_(book)) or [Wald](https://en.wikipedia.org/wiki/General_Relativity_(book)) can use to recover any definition, formula, or transformation rule without paging through a thicker book.

The pages are denser than the rest of the library. Tensor calculus has two languages in serious use — the physicist's index notation and the mathematician's coordinate-free notation — and two equally serious viewpoints — the [embedded picture](note:embedded-manifold) where $M$ sits inside $\mathbb{R}^N$ and the [abstract picture](note:abstract-manifold) where it doesn't. Each new object is presented in all four panes, with a [running example](note:running-example) on the sphere $S^2$ that anchors the abstract material to a concrete computation.

Where this book overlaps with [`calculus-on-manifolds`](../calculus-on-manifolds/index.md) — tangent spaces, cotangent spaces, tensor fields, the Lie bracket, integration — the link points there rather than repeating the derivation. The manifolds book is the abstract foundation; this one is the GR-flavored extension.

Notation throughout: Greek indices $\mu, \nu, \rho, \sigma$ range over spacetime dimensions $0, 1, 2, 3$; Latin indices $i, j, k$ range over spatial dimensions $1, 2, 3$. The [Einstein summation convention](note:einstein-summation) is in force: any index appearing once up and once down in the same expression is summed. The metric signature is $(-, +, +, +)$ when Lorentzian; arguments not involving causal structure go through unchanged for either signature.

## Contents

1. [Vectors and covectors](01-vectors-and-covectors/index.md) — why dual vectors deserve equal billing, two views of each.
2. [Tensors](02-tensors/index.md) — the $(r, s)$ construction, components, and the parallel notations.
3. [The metric](03-metric/index.md) — what the metric does, raising and lowering, Riemannian vs Lorentzian.
4. [Connection and curvature](04-connection-and-curvature/index.md) — affine connections, the covariant derivative, Riemann and torsion.
5. [General relativity](05-general-relativity/index.md) — the Einstein equations, Schwarzschild, Einstein–Cartan.

A [notes page](06-notes.md) collects supplementary definitions for terms the book uses without expanding.
