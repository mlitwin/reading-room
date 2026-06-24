---
title: Cotangent space and 1-forms
---

The **cotangent space at $p$** is the [dual](note:dual-space) of the tangent space:
$$T^*_p M := (T_p M)^*,$$
the space of linear functionals on $T_p M$. Whatever the tangent space is, its dual is automatically defined; both have dimension $n$, and the duality is symmetric — neither is "primary." Its elements are called **covectors**, **dual vectors**, or **1-forms at $p$**.

## Dual basis and components

In coordinates the basis dual to $\{\partial_i|_p\}$ is denoted $\{dx^i|_p\}$, characterized by
$$dx^i(\partial_j) = \delta^i_j.$$
An arbitrary covector is
$$\omega = \omega_i\, dx^i, \qquad \omega_i \in \mathbb{R},$$
with the $\omega_i$ the **covariant components** of $\omega$ — index down.

**Differential of a function.** For $f \in C^\infty(M)$, the covector
$$df_p \in T^*_p M, \qquad df_p(v) := v(f)$$
is the **differential** of $f$ at $p$. In coordinates $df_p = \frac{\partial f}{\partial x^i}(p)\, dx^i|_p$. In the [embedded view](note:embedded-manifold), every covector arises as such a $df_p$ (already from linear $f$, since the tangent plane is finite-dimensional); abstractly, $T^*_p M$ contains all linear functionals whether or not they come from a function on $M$.

## Transformation rule

Under $x^i \mapsto x'^{i'}(x)$ the dual basis and components transform the *same* way as each other:
$$dx'^{i'} = \frac{\partial x'^{i'}}{\partial x^j}\, dx^j, \qquad \omega_{i'}' = \frac{\partial x^j}{\partial x'^{i'}}\, \omega_j.$$
Components move *with* the basis ("co", together) — the opposite convention from vectors, and the defining property of a covariant index.

**Index notation:** $\omega_i$, index down. **Coordinate-free:** $\omega \in T^*_p M$, the pairing written $\omega(v)$ or $\langle\omega, v\rangle$.

## Pairing

The defining operation between vectors and covectors is the pairing
$$\omega(v) = \omega_i\, v^i \in \mathbb{R}$$
— sum one up index with one down index. Both transformation rules cancel, so this is a chart-independent number; it is the geometric content of the duality. For $f \in C^\infty(M)$ and a vector field $X$, $df(X) = X(f)$.

## 1-form fields and pullback

A **1-form** $\omega$ on $M$ is a smooth section of the cotangent bundle $T^*M := \bigsqcup_p T^*_p M$, i.e. a smoothly varying assignment $p \mapsto \omega_p \in T^*_p M$. In coordinates $\omega = \omega_i\, dx^i$ with $\omega_i \in C^\infty(U)$; the space of 1-forms is $\Omega^1(M)$.

**Pullback.** For a smooth map $F: M \to N$ and $\eta \in \Omega^1(N)$,
$$(F^* \eta)_p(v) := \eta_{F(p)}(dF_p \cdot v), \qquad v \in T_p M.$$
Pullbacks of forms always exist — forms are contravariant, while vector fields can only be pushed forward through diffeomorphisms. This asymmetry — pullback for covectors, pushforward for vectors — is the prototype for all of tensor calculus.
