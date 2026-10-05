---
title: The Poincaré lemma
---

**Poincaré lemma.** On any [contractible](note:contractible) open subset $U$ of a smooth manifold (or, more concretely, on a [star-shaped](note:star-shaped) open subset of $\mathbb{R}^n$),
$$H^k_{dR}(U) = 0 \quad \text{for all } k \geq 1.$$

Equivalently: on a contractible manifold, every closed form of positive degree is exact.

**Explicit primitive.** If $U \subseteq \mathbb{R}^n$ is star-shaped about the origin and $\tens{\omega} \in \Omega^k(U)$ is closed with $k \geq 1$, then $\tens{\omega} = d(h\tens{\omega})$, where the **cone operator** $h: \Omega^k(U) \to \Omega^{k-1}(U)$ is
$$(h\tens{\omega})_x(\tens{v}_1, \ldots, \tens{v}_{k-1}) := \int_0^1 t^{k-1}\, \tens{\omega}_{tx}(x, \tens{v}_1, \ldots, \tens{v}_{k-1})\, dt.$$

The identity $h \circ d + d \circ h = \mathrm{id}$ on $\Omega^k(U)$, $k \geq 1$ (a *chain homotopy* between the identity and zero), is what produces the primitive when $\tens{\omega}$ is closed.

**Consequence: locally, closed ⇔ exact.** Every closed form has a local primitive in some neighborhood of every point. So the cohomology
$$H^k_{dR}(M)$$
measures the **global** obstruction to patching local primitives together — purely a topological invariant.

**Sheaf-theoretic restatement.** The complex of sheaves
$$0 \to \underline{\mathbb{R}} \hookrightarrow \Omega^0 \xrightarrow{d} \Omega^1 \xrightarrow{d} \Omega^2 \xrightarrow{d} \cdots$$
is exact — that is the Poincaré lemma — so it is a resolution of the constant [sheaf](note:sheaf) $\underline{\mathbb{R}}$ on $M$. Each $\Omega^k$ is fine (partitions of unity), hence acyclic, so the cohomology of the complex of global sections — $H^*_{dR}(M)$ — is the sheaf cohomology $H^*(M; \underline{\mathbb{R}})$, which on a manifold equals singular cohomology with $\mathbb{R}$ coefficients. This is the abstract route to de Rham's theorem.
