---
title: Raising and lowering
---

A metric identifies $T_p M$ with $T^*_p M$. In components this is **raising and lowering indices**: lowering uses $g_{\mu\nu}$, raising uses $g^{\mu\nu}$.

## The musical isomorphisms

Define $\flat: T_p M \to T^*_p M$ (*flat*, lowering) and $\sharp: T^*_p M \to T_p M$ (*sharp*, raising) by
$$\tens{v}^\flat(\tens{w}) := \tens{g}(\tens{v}, \tens{w}), \qquad \tens{g}(\tens{\omega}^\sharp, \tens{w}) := \tens{\omega}(\tens{w}).$$
In components,
$$v_\mu = g_{\mu\nu}\, v^\nu, \qquad \omega^\mu = g^{\mu\nu}\, \omega_\nu.$$
Non-degeneracy makes $\flat$ injective, hence an isomorphism, since the two spaces have the same dimension; $\sharp$ is its inverse. This is the identification of vectors with covectors that a bare manifold lacks ([chapter 1](../01-manifolds/03-cotangent-space.md)).

**Gradient.** The differential $df$ is a covector on any manifold. The **gradient** $\operatorname{grad} f := (df)^\sharp$, with components $g^{\mu\nu}\, \partial_\nu f$, is a vector and needs the metric. In Cartesian coordinates on $\mathbb{R}^n$ the two have the same components, which is why vector calculus never distinguishes them. In polar coordinates they already differ.

**Higher rank.** Raising and lowering act on one chosen index. The kernel letter stays and the index moves:
$$T_\mu{}^\nu := g_{\mu\rho}\, T^{\rho\nu}, \qquad T^{\mu\nu} = g^{\mu\rho}\, T_\rho{}^\nu.$$
The horizontal position of each index is kept, so the slot order records which slot is which.

## Index gymnastics

- $g^{\mu\nu} g_{\nu\rho} = \delta^\mu_\rho$: the definition of the inverse.
- $g_{\mu\nu} v^\mu w^\nu = v_\mu w^\mu = v^\mu w_\mu = g^{\mu\nu} v_\mu w_\nu$ : the inner product, written four ways.
- $g_{\mu\nu} g^{\mu\nu} = \delta^\mu_\mu = n$.

## Trace of a $(1, 1)$-tensor

The **trace** of a $(1, 1)$-tensor $T^\mu{}_\nu$, a linear map $T_p M \to T_p M$, is the [contraction](note:contraction)
$$\mathrm{tr}\, \tens{T} := T^\mu{}_\mu.$$
It needs no metric. For a $(0, 2)$-tensor $T_{\mu\nu}$, the trace requires raising one index:
$$\mathrm{tr}_g \tens{T} := g^{\mu\nu}\, T_{\mu\nu} = T^\mu{}_\mu.$$
This is the **metric trace**. The metric trace of $\tens{g}$ is $n$, and the metric trace of the [Ricci tensor](note:ricci-and-einstein-tensors) gives the scalar curvature ([chapter 8](../08-connection-and-curvature/04-torsion-and-curvature.md)).
