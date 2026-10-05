---
title: Phase space and the symplectic form
---

## The symplectic form

Phase space $T^*Q$ carries the [tautological 1-form](../01-manifolds/03-cotangent-space.md) $\tens{\theta} = p_i\, dq^i$, defined without coordinates. Its exterior derivative is the canonical **[symplectic form](note:symplectic-form)**:
$$\tens{\omega} := d\tens{\theta} = dp_i \wedge dq^i.$$
It is closed (indeed exact) and non-degenerate: $\tens{X} \mapsto \iota_{\tens{X}} \tens{\omega}$ is an isomorphism from vector fields to 1-forms. **Darboux's theorem** says every symplectic manifold looks like this locally: coordinates $(q^i, p_i)$ with $\tens{\omega} = dp_i \wedge dq^i$ exist around every point. Such coordinates are called canonical.

Sign conventions differ between texts. This book follows Arnold, as recorded on the [notation page](../00-notation.md).

## Hamiltonian vector fields

A function $H$ on $T^*Q$ determines a vector field $\tens{X}_H$ by
$$\iota_{\tens{X}_H} \tens{\omega} = -dH, \qquad \tens{X}_H = \frac{\partial H}{\partial p_i}\, \frac{\partial}{\partial q^i} - \frac{\partial H}{\partial q^i}\, \frac{\partial}{\partial p_i}.$$
Its integral curves are exactly the solutions of [Hamilton's equations](01-legendre-and-hamiltons-equations.md). Check: $\iota_{\tens{X}}(dp_i \wedge dq^i) = (\iota_{\tens{X}}\, dp_i)\, dq^i - dp_i\, (\iota_{\tens{X}}\, dq^i)$. Substituting $\tens{X}_H$ gives $-\partial_{q^i} H\, dq^i - \partial_{p_i} H\, dp_i = -dH$.

## Poisson brackets

For functions $f, g$ on phase space,
$$\{f, g\} := \tens{X}_g(f) = \tens{\omega}(\tens{X}_g, \tens{X}_f) = \frac{\partial f}{\partial q^i} \frac{\partial g}{\partial p_i} - \frac{\partial f}{\partial p_i} \frac{\partial g}{\partial q^i}.$$
The bracket is bilinear and antisymmetric, satisfies the Jacobi identity, and is a derivation in each slot: $\{f, gh\} = \{f, g\}\, h + g\, \{f, h\}$. That makes $C^\infty(T^*Q)$ a [Lie algebra](note:lie-algebra) and a **[Poisson algebra](note:poisson-bracket)**. The fundamental brackets are
$$\{q^i, q^j\} = 0, \qquad \{p_i, p_j\} = 0, \qquad \{q^i, p_j\} = \delta^i_j.$$

**Evolution.** For any $f(q, p, t)$,
$$\frac{df}{dt} = \{f, H\} + \frac{\partial f}{\partial t}.$$
Hamilton's equations themselves read $\dot q^i = \{q^i, H\}$, $\dot p_i = \{p_i, H\}$. A function with no explicit time dependence is conserved iff $\{f, H\} = 0$. The bracket of two conserved quantities is conserved (Poisson's theorem, a consequence of the Jacobi identity).

## Canonical transformations and Liouville

A diffeomorphism $\Phi$ of $T^*Q$ is **canonical** (symplectic) if $\Phi^* \tens{\omega} = \tens{\omega}$; equivalently, it preserves all Poisson brackets. The flow of any Hamiltonian vector field is canonical. By [Cartan's formula](../02-vector-fields-and-flows/03-lie-derivative.md),
$$\Lie_{\tens{X}_H} \tens{\omega} = d(\iota_{\tens{X}_H} \tens{\omega}) + \iota_{\tens{X}_H}\, d\tens{\omega} = -d\,dH + 0 = 0.$$

**Liouville's theorem.** The top-degree form $\tens{\omega}^n / n!$ is (up to sign) the phase-space volume $dq^1 \cdots dq^n\, dp_1 \cdots dp_n$. Since $\Lie_{\tens{X}_H}$ is a derivation of the wedge product and kills $\tens{\omega}$, it kills $\tens{\omega}^n$. The Hamiltonian flow therefore preserves phase-space volume: for any region $D$,
$$\frac{d}{dt} \int_{\Phi_t(D)} \frac{\tens{\omega}^n}{n!} = 0.$$
This is a foundation of statistical mechanics. It uses only the symplectic form, with no metric on phase space.
