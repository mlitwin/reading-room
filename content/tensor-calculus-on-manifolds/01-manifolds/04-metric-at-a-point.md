---
title: "Aside: a metric at a point"
---

Everything in Parts I and II works on a bare manifold, with no lengths, angles or causal structure. This page is the one preview of the structure Part III adds, at the level where it is pure linear algebra: a [single tangent space](note:tangent-space) at a single point. **Nothing in chapters 2–8 uses this page.** It sits here because the previous page raises exactly the question it answers — vectors and covectors are dual but not identified — and because its Lorentzian case is where special relativity lives.

## An inner product on $T_p M$

A **metric at $p$** is a bilinear map $\tens{g}_p: T_p M \times T_p M \to \mathbb{R}$ that is **symmetric** ($\tens{g}_p(\tens{v}, \tens{w}) = \tens{g}_p(\tens{w}, \tens{v})$) and **non-degenerate** (only $\tens{v} = 0$ pairs to zero with every $\tens{w}$). In a coordinate basis its components are $g_{\mu\nu} := \tens{g}_p(\partial_\mu, \partial_\nu)$, a symmetric invertible matrix; the entries of the inverse matrix are written $g^{\mu\nu}$.

This is linear algebra on one vector space. No smoothness, no neighborhood of $p$, no structure of $M$ beyond $T_p M$ itself is involved.

## What it buys: the musical isomorphisms

Non-degeneracy makes
$$\flat: T_p M \to T^*_p M, \qquad \tens{v}^\flat := \tens{g}_p(\tens{v}, \cdot)$$
injective, hence — equal finite dimensions — an isomorphism, with inverse $\sharp$. In components, $v_\mu = g_{\mu\nu}\, v^\nu$ and $\omega^\mu = g^{\mu\nu}\, \omega_\nu$. These are the [musical isomorphisms](note:musical-isomorphism): the canonical identification of vectors with covectors that the [previous page](03-cotangent-space.md) said a bare manifold lacks. Chapter 11 [develops them in full](../11-metric/02-raising-and-lowering.md) as "raising and lowering indices."

## Signature and causal structure

By Sylvester's law of inertia, a basis of $T_p M$ can always be chosen in which $[g_{\mu\nu}]$ is diagonal with entries $\pm 1$, and the number of each sign — the **signature** — is independent of the choice. Two cases matter in this book:

- **Riemannian**, signature $(+, \cdots, +)$: $\tens{g}_p$ is positive-definite, an ordinary inner product. Every non-zero vector has a positive length $\sqrt{\tens{g}_p(\tens{v}, \tens{v})}$, and angles are defined.
- **Lorentzian**, signature $(-, +, \cdots, +)$: the tangent space acquires **causal structure**. A vector is **timelike** if $\tens{g}_p(\tens{v}, \tens{v}) < 0$, **null** if $\tens{g}_p(\tens{v}, \tens{v}) = 0$, **spacelike** if $\tens{g}_p(\tens{v}, \tens{v}) > 0$. The null vectors form a double cone — the **lightcone** — with the timelike vectors inside it and the spacelike vectors outside.

In relativity, $T_p M$ with a Lorentzian $\tens{g}_p$ *is* the local inertial frame at the event $p$: 4-velocities of massive particles are timelike, light rays are null, and everything special relativity says about one observer at one event is linear algebra in this single tangent space. Gravity — curvature, dynamics — enters only when $\tens{g}_p$ is allowed to vary with $p$.

## What Part III adds

A **metric on $M$** is a smooth field $p \mapsto \tens{g}_p$ of such bilinear forms — the subject of [chapter 11](../11-metric/index.md). Only then do lengths of curves, [proper time](note:proper-time), [isometries](note:isometry), and volume exist; and only the *variation* of $\tens{g}_p$ from point to point produces the connection and curvature of chapter 12. Until then, Parts I and II proceed metric-free.
