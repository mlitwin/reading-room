---
title: Cotangent space and 1-forms
---

The **cotangent space at $p$** is the dual of the tangent space:
$$T^*_p M := (T_p M)^*.$$

Elements are linear functionals on $T_p M$; in coordinates the dual basis to $\{\partial_i|_p\}$ is denoted $\{dx^i|_p\}$, characterized by
$$dx^i(\partial_j) = \delta^i_j.$$

**Differential of a function.** For $f \in C^\infty(M)$, the cotangent vector
$$df_p \in T^*_p M, \qquad df_p(v) := v(f)$$
is the **differential** of $f$ at $p$. In coordinates,
$$df_p = \frac{\partial f}{\partial x^i}(p)\, dx^i\big|_p.$$

**1-form.** A **1-form** $\omega$ on $M$ is a smooth section of the cotangent bundle $T^*M := \bigsqcup_p T^*_p M$, i.e., a smoothly varying assignment $p \mapsto \omega_p \in T^*_p M$. In coordinates,
$$\omega = \omega_i\, dx^i, \quad \omega_i \in C^\infty(U).$$

The space of 1-forms on $M$ is $\Omega^1(M)$.

**Pullback.** For a smooth map $F: M \to N$ and $\eta \in \Omega^1(N)$,
$$(F^* \eta)_p(v) := \eta_{F(p)}(dF_p \cdot v), \qquad v \in T_p M.$$
Pullbacks of forms always exist — forms are contravariant, while vector fields can only be pushed forward through diffeomorphisms.

**Pairing.** For $f \in C^\infty(M)$ and $X$ a vector field, $df(X) = X(f) \in C^\infty(M)$.
