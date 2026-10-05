---
title: Cotangent space and 1-forms
---

The **cotangent space at $p$** is the [dual](note:dual-space) of the [tangent space](note:tangent-space):
$$T^*_p M := (T_p M)^*,$$
the space of linear functionals on $T_p M$. Its elements are called **covectors**, **dual vectors**, or **1-forms at $p$**. Both spaces have dimension $n$, but they are not canonically *identified*: no particular isomorphism $T_p M \to T^*_p M$ exists without extra structure. A metric supplies one, the [musical isomorphisms](note:musical-isomorphism) of [chapter 3](../03-metric/02-raising-and-lowering.md).

## Dual basis and components

In coordinates the basis dual to $\{\partial_i|_p\}$ is denoted $\{dx^i|_p\}$, characterized by
$$dx^i(\partial_j) = \delta^i_j.$$
An arbitrary covector is
$$\tens{\omega} = \omega_i\, dx^i, \qquad \omega_i \in \mathbb{R},$$
with the $\omega_i$ the **covariant components** of $\tens{\omega}$ — index down.

**Differential of a function.** For $f \in C^\infty(M)$, the covector
$$df_p \in T^*_p M, \qquad df_p(\tens{v}) := \tens{v}(f)$$
is the **differential** of $f$ at $p$. In coordinates $df_p = \frac{\partial f}{\partial x^i}(p)\, dx^i|_p$. Every covector at $p$ is some $df_p$: take $f = c_i x^i$ in a chart, cut off away from $p$ by a bump function. (In the [embedded view](note:embedded-manifold), restricting a linear function on $\mathbb{R}^N$ already suffices.)

## Transformation rule

Under $x^i \mapsto x'^{i'}(x)$ the dual basis and the components again transform oppositely:
$$dx'^{i'} = \frac{\partial x'^{i'}}{\partial x^j}\, dx^j, \qquad \omega_{i'}' = \frac{\partial x^j}{\partial x'^{i'}}\, \omega_j.$$
The components $\omega_i$ transform with the same matrix $\partial x^j/\partial x'^{i'}$ as the tangent basis $\partial_i$ ("co", together) — the defining property of a covariant index. Vector components $v^i$ use the inverse matrix.

**Index notation:** $\omega_i$, index down. **Coordinate-free:** $\tens{\omega} \in T^*_p M$, the pairing written $\tens{\omega}(\tens{v})$ or $\langle\tens{\omega}, \tens{v}\rangle$.

## Pairing

The defining operation between vectors and covectors is the pairing
$$\tens{\omega}(\tens{v}) = \omega_i\, v^i \in \mathbb{R},$$
one index up summed against one down. The two transformation rules cancel, so the pairing is a chart-independent number. Pairing with a differential is differentiation: $df_p(\tens{v}) = \tens{v}(f)$.

## Cotangent bundle and 1-forms

The **cotangent bundle** $T^*M := \bigsqcup_p T^*_p M$ is a smooth $2n$-manifold, with projection $\pi: T^*M \to M$. A chart $(x^i)$ induces coordinates $(x^i, p_i)$: the covector $\tens{\alpha} = p_i\, dx^i$ at the point with coordinates $x^i$ is assigned the $2n$ numbers $(x^i, p_i)$.

A **1-form** $\tens{\omega}$ on $M$ is a smooth section of $T^*M$, i.e. a smoothly varying assignment $p \mapsto \tens{\omega}_p \in T^*_p M$. In coordinates $\tens{\omega} = \omega_i\, dx^i$ with $\omega_i \in C^\infty(U)$; the space of 1-forms is $\Omega^1(M)$.

**Pullback.** For a smooth map $F: M \to N$ and $\tens{\eta} \in \Omega^1(N)$,
$$(F^* \tens{\eta})_p(\tens{v}) := \tens{\eta}_{F(p)}(dF_p \cdot \tens{v}), \qquad \tens{v} \in T_p M.$$
Forms pull back along *any* smooth map. Tangent vectors push forward pointwise, but a field of them pushes forward to a field only along a diffeomorphism. This asymmetry, pullback for covectors and pushforward for vectors, recurs throughout tensor calculus. (Terminology clash: $F \mapsto F^*$ reverses arrows, so it is "contravariant" in the categorical sense, although the components $\omega_i$ are "covariant" under chart changes. Both usages are standard.)

## The tautological form

$T^*M$ carries a canonical 1-form that needs no extra structure, the **tautological form** $\tens{\theta}$. At a point $\tens{\alpha} \in T^*_q M$ it is
$$\tens{\theta}_{\tens{\alpha}}(\tens{V}) := \tens{\alpha}\bigl(d\pi \cdot \tens{V}\bigr), \qquad \tens{V} \in T_{\tens{\alpha}}(T^*M),$$
and in induced coordinates $\tens{\theta} = p_i\, dx^i$. Its exterior derivative $d\tens{\theta} = dp_i \wedge dx^i$ is the symplectic form of Hamiltonian mechanics ([chapter 11](../11-hamiltonian-mechanics/02-phase-space-and-symplectic-form.md)). There, $T^*Q$ is phase space and $(x^i, p_i)$ are written $(q^i, p_i)$.
