---
title: Dual vectors and 1-forms
---

A **covector** at $p$ — equivalently, a **dual vector** or **1-form at $p$** — is a linear functional on $T_p M$. The cotangent space
$$T^*_p M := (T_p M)^*$$
is the [dual](note:dual-space) of the tangent space. Whatever the tangent space is, its dual is automatically defined; both have the same dimension $n$, and the duality is symmetric — neither is "primary."

## Two views

**Embedded view.** A covector at $p$ is a linear function on the affine tangent plane $T_p M \subseteq \mathbb{R}^N$. Concretely: pick any smooth function $f$ on a neighborhood of $p$; its differential
$$df_p(v) := v(f)$$
is a covector. Every covector at $p$ arises this way (in fact already from linear $f$, since the tangent plane is finite-dimensional).

**Abstract view.** A covector is an $\mathbb{R}$-linear map $\omega: T_p M \to \mathbb{R}$, full stop. The differential $df_p$ above is one particular construction; the dual space contains all linear functionals whether they come from a function on $M$ or not. (See the [manifolds book](../../calculus-on-manifolds/01-manifolds/03-cotangent-space.md) for the bundle picture.)

## Dual basis

In a chart $x^\mu$, the basis dual to $\{\partial_\mu\}$ is
$$\{ dx^\mu \}, \qquad dx^\mu(\partial_\nu) = \delta^\mu_\nu.$$
The $dx^\mu$ are the differentials of the coordinate functions $x^\mu \in C^\infty(U)$. An arbitrary covector is
$$\omega = \omega_\mu\, dx^\mu,$$
with $\omega_\mu \in \mathbb{R}$. The numbers $\omega_\mu$ are the **covariant components** of $\omega$ — index down.

## Transformation rule

Under $x^\mu \mapsto x'^{\mu'}(x)$, the dual basis and covariant components transform as
$$dx'^{\mu'} = \frac{\partial x'^{\mu'}}{\partial x^\nu}\, dx^\nu, \qquad \omega_{\mu'}' = \frac{\partial x^\nu}{\partial x'^{\mu'}}\, \omega_\nu.$$
Components transform the *same* way as the basis ("co", together) — the opposite convention from vectors. This is the defining property of a covariant index.

**Index notation:** $\omega_\mu$ with the index down.  
**Coordinate-free:** $\omega \in T^*_p M$, the pairing written $\omega(v)$ or $\langle \omega, v \rangle$.

## Pairing

The defining operation between vectors and covectors is the pairing
$$\omega(v) = \omega_\mu v^\mu \in \mathbb{R}.$$
The index contraction is automatic in coordinates: one up, one down, sum. This is a chart-independent number — both transformation rules cancel — and is the geometric content of the duality.

For a function $f$ and a vector field $X$:
$$df(X) = X(f) = X^\mu\, \partial_\mu f \in C^\infty(M).$$

## 1-form fields

A **1-form** $\omega$ on $M$ assigns a covector $\omega_p$ at every $p$, smoothly. In a chart,
$$\omega = \omega_\mu(x)\, dx^\mu,$$
with $\omega_\mu \in C^\infty(U)$. The space of smooth 1-forms is $\Omega^1(M)$.

Unlike vector fields, 1-forms can be [pulled back](../../calculus-on-manifolds/01-manifolds/03-cotangent-space.md) by any smooth map (not only diffeomorphisms). This asymmetry — pullback for covectors, pushforward for vectors — is the prototype for all of tensor calculus.
