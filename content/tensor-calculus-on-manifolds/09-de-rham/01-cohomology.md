---
title: De Rham cohomology
---

The **$k$-th de Rham cohomology group** of $M$ is the quotient
$$H^k_{dR}(M) := \frac{Z^k(M)}{B^k(M)} = \frac{\ker\bigl(d: \Omega^k \to \Omega^{k+1}\bigr)}{\mathrm{im}\bigl(d: \Omega^{k-1} \to \Omega^k\bigr)}.$$

This is an $\mathbb{R}$-vector space. Elements are equivalence classes $[\tens{\omega}]$ of [closed](note:closed-and-exact-forms) $k$-forms, with $[\tens{\omega}] = [\tens{\omega}']$ iff $\tens{\omega} - \tens{\omega}'$ is exact.

The wedge product descends to cohomology, making the total cohomology
$$H^*_{dR}(M) := \bigoplus_{k=0}^n H^k_{dR}(M)$$
a graded-commutative $\mathbb{R}$-algebra.

**Basic facts.**

- $H^0_{dR}(M) \cong \mathbb{R}^c$ where $c$ is the number of connected components of $M$. (A closed 0-form is a locally constant function.)
- $H^k_{dR}(M) = 0$ for $k > \dim M$.
- For $M$ compact, connected, oriented, without boundary: $H^n_{dR}(M) \cong \mathbb{R}$, with isomorphism $[\tens{\omega}] \mapsto \int_M \tens{\omega}$.
- A smooth map $F: M \to N$ induces a graded-algebra map $F^*: H^*_{dR}(N) \to H^*_{dR}(M)$.
- **[Homotopy invariance](note:contractible).** If $F \simeq G$ smoothly, then $F^* = G^*$ on cohomology.

**De Rham's theorem.** The de Rham cohomology is naturally isomorphic to the [singular cohomology](note:singular-cohomology) of $M$ with real coefficients:
$$H^k_{dR}(M) \;\cong\; H^k(M; \mathbb{R}).$$

A calculation made entirely with smooth forms thus computes a topological invariant, one defined without any smooth structure.

**Examples.**

- $\mathbb{R}^n$: $H^0 = \mathbb{R}$, all higher $H^k = 0$ (Poincaré lemma).
- $S^n$: $H^0 = H^n = \mathbb{R}$, all middle $H^k = 0$.
- $T^n = (S^1)^n$: $\dim H^k = \binom{n}{k}$ — the full exterior algebra on $n$ generators.
