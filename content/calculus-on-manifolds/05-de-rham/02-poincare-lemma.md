---
title: The Poincaré lemma
---

**Poincaré lemma.** On any contractible open subset $U$ of a smooth manifold (or, more concretely, on a star-shaped open subset of $\mathbb{R}^n$),
$$H^k_{dR}(U) = 0 \quad \text{for all } k \geq 1.$$

Equivalently: on a contractible manifold, every closed form of positive degree is exact.

**Explicit primitive.** If $U \subseteq \mathbb{R}^n$ is star-shaped about the origin and $\omega \in \Omega^k(U)$ is closed with $k \geq 1$, then $\omega = d(h\omega)$, where the **cone operator** $h: \Omega^k(U) \to \Omega^{k-1}(U)$ is
$$(h\omega)_x(v_1, \ldots, v_{k-1}) := \int_0^1 t^{k-1}\, \omega_{tx}(x, v_1, \ldots, v_{k-1})\, dt.$$

The identity $h \circ d + d \circ h = \mathrm{id}$ (a *chain homotopy* between identity and zero) is what produces the primitive when $\omega$ is closed.

**Consequence: locally, closed ⇔ exact.** Every closed form has a local primitive in some neighborhood of every point. So the cohomology
$$H^k_{dR}(M)$$
measures the **global** obstruction to patching local primitives together — purely a topological invariant.

**Sheaf-theoretic restatement.** The complex of sheaves
$$0 \to \underline{\mathbb{R}} \hookrightarrow \Omega^0 \xrightarrow{d} \Omega^1 \xrightarrow{d} \Omega^2 \xrightarrow{d} \cdots$$
is an acyclic resolution of the constant sheaf $\underline{\mathbb{R}}$ on $M$. The Poincaré lemma is exactly the statement that this resolution is exact. Sheaf cohomology of the global sections then equals singular cohomology with $\mathbb{R}$ coefficients — the abstract way de Rham's theorem falls out.
