---
title: Cotangent space and 1-forms
---

The **cotangent space at $p$** is the [dual](note:dual-space) of the [tangent space](note:tangent-space):
$$T^*_p M := (T_p M)^*,$$
the space of linear functionals on $T_p M$. Its elements are called **covectors**, **dual vectors**, or **1-forms at $p$**. Whatever the tangent space is, its dual is automatically defined; both have dimension $n$, and the duality is symmetric — neither is "primary." But the two are not canonically *identified*: no particular isomorphism $T_p M \to T^*_p M$ is available without extra structure. A metric supplies one — the [musical isomorphisms](note:musical-isomorphism); the [next page](04-metric-at-a-point.md) previews this at a single point, and [Part II](../08-metric/02-raising-and-lowering.md) develops it in full.

## Dual basis and components

In coordinates the basis dual to $\{\partial_i|_p\}$ is denoted $\{dx^i|_p\}$, characterized by
$$dx^i(\partial_j) = \delta^i_j.$$
An arbitrary covector is
$$\tens{\omega} = \omega_i\, dx^i, \qquad \omega_i \in \mathbb{R},$$
with the $\omega_i$ the **covariant components** of $\tens{\omega}$ — index down.

**Differential of a function.** For $f \in C^\infty(M)$, the covector
$$df_p \in T^*_p M, \qquad df_p(\tens{v}) := \tens{v}(f)$$
is the **differential** of $f$ at $p$. In coordinates $df_p = \frac{\partial f}{\partial x^i}(p)\, dx^i|_p$. Every covector at $p$ arises as such a $df_p$: in the [embedded view](note:embedded-manifold) already from the restriction of a *linear* function on the ambient $\mathbb{R}^N$; abstractly from a linear combination of coordinate functions in a chart (cut off away from $p$ by a bump function). Differentials of functions don't just live in $T^*_p M$ — pointwise, they fill it.

## Transformation rule

Under $x^i \mapsto x'^{i'}(x)$ the dual basis and the components again transform oppositely:
$$dx'^{i'} = \frac{\partial x'^{i'}}{\partial x^j}\, dx^j, \qquad \omega_{i'}' = \frac{\partial x^j}{\partial x'^{i'}}\, \omega_j.$$
The components $\omega_i$ transform with the same matrix $\partial x^j/\partial x'^{i'}$ as the tangent basis $\partial_i$ ("co", together) — the defining property of a covariant index. Vector components $v^i$ use the inverse matrix.

**Index notation:** $\omega_i$, index down. **Coordinate-free:** $\tens{\omega} \in T^*_p M$, the pairing written $\tens{\omega}(\tens{v})$ or $\langle\tens{\omega}, \tens{v}\rangle$.

## Pairing

The defining operation between vectors and covectors is the pairing
$$\tens{\omega}(\tens{v}) = \omega_i\, v^i \in \mathbb{R}$$
— sum one up index with one down index. Both transformation rules cancel, so this is a chart-independent number; it is the geometric content of the duality. For $f \in C^\infty(M)$ and a vector field $\tens{X}$, $df(\tens{X}) = \tens{X}(f)$.

## 1-form fields and pullback

A **1-form** $\tens{\omega}$ on $M$ is a smooth section of the cotangent bundle $T^*M := \bigsqcup_p T^*_p M$, i.e. a smoothly varying assignment $p \mapsto \tens{\omega}_p \in T^*_p M$. In coordinates $\tens{\omega} = \omega_i\, dx^i$ with $\omega_i \in C^\infty(U)$; the space of 1-forms is $\Omega^1(M)$.

**Pullback.** For a smooth map $F: M \to N$ and $\tens{\eta} \in \Omega^1(N)$,
$$(F^* \tens{\eta})_p(\tens{v}) := \tens{\eta}_{F(p)}(dF_p \cdot \tens{v}), \qquad \tens{v} \in T_p M.$$
Pullbacks of forms always exist — the assignment $F \mapsto F^*$ reverses arrows, "contravariant" in the categorical sense — while vector fields can only be pushed forward through diffeomorphisms. (Terminology collision: forms pull back *contravariantly* as a functor even though their components $\omega_i$ transform *covariantly* under chart change. Both usages are standard; context disambiguates.) This asymmetry — pullback for covectors, pushforward for vectors — is the prototype for all of tensor calculus.
