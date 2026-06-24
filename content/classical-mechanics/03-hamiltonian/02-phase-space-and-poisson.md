---
title: Phase space and the Poisson bracket
---

**Phase space.** The state space of a Hamiltonian system is the cotangent bundle $T^* Q$ with coordinates $(q^i, p_i)$. It carries a canonical [2-form](../../tensor-calculus-on-manifolds/03-differential-forms/01-k-forms-and-wedge.md)
$$\omega := dp_i \wedge dq^i$$
(the [symplectic form](note:symplectic-form)) that's [non-degenerate and closed](../../tensor-calculus-on-manifolds/03-differential-forms/03-closed-and-exact.md). Hamilton's equations are the integral curves of the vector field $X_H$ defined by $\iota_{X_H} \omega = dH$, with $\iota$ the [interior product](../../tensor-calculus-on-manifolds/02-vector-fields-and-flows/03-lie-derivative.md) of a vector field into a form.

**Poisson bracket.** For smooth functions $f, g$ on phase space,
$$\{f, g\} := \frac{\partial f}{\partial q^i} \frac{\partial g}{\partial p_i} - \frac{\partial f}{\partial p_i} \frac{\partial g}{\partial q^i}.$$

Properties:

- $\mathbb{R}$-bilinear.
- **Antisymmetric**: $\{f, g\} = -\{g, f\}$.
- **Jacobi identity**: $\{f, \{g, h\}\} + \{g, \{h, f\}\} + \{h, \{f, g\}\} = 0$.
- **Leibniz**: $\{f, gh\} = \{f, g\} h + g \{f, h\}$.

These make $(C^\infty(T^* Q), \{\cdot, \cdot\})$ a Lie algebra (and a Poisson algebra). The fundamental brackets:
$$\{q^i, q^j\} = 0, \qquad \{p_i, p_j\} = 0, \qquad \{q^i, p_j\} = \delta^i_j.$$

**Evolution.** For any smooth $f(q, p, t)$ on phase space,
$$\frac{df}{dt} = \{f, H\} + \frac{\partial f}{\partial t}.$$
In particular Hamilton's equations are themselves $\dot q^i = \{q^i, H\}$, $\dot p_i = \{p_i, H\}$.

**Conserved quantities.** A function $f$ with no explicit time dependence is a constant of motion iff $\{f, H\} = 0$. Two constants of motion $f, g$ produce a third via the Poisson bracket $\{f, g\}$ (Poisson's theorem; immediate from the Jacobi identity).

**Canonical transformations.** A diffeomorphism $\Phi: T^*Q \to T^*Q$ is **canonical** if it preserves the symplectic form, $\Phi^* \omega = \omega$. Equivalently, it preserves all Poisson brackets. Hamilton's equations themselves generate a one-parameter family of canonical transformations — the **Hamiltonian flow**. Canonical transformations are the natural symmetries of the Hamiltonian formalism.

**Liouville's theorem.** The Hamiltonian flow preserves phase-space volume:
$$\frac{d}{dt} \int_{\Phi_t(D)} dq^1 \cdots dq^n\, dp_1 \cdots dp_n = 0$$
for any region $D \subseteq T^*Q$. Geometrically, $\omega^n / n!$ is the volume form and it's preserved by canonical transformations. This is the foundation of statistical mechanics.
