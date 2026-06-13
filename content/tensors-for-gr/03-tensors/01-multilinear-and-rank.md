---
title: Multilinear maps and rank
---

The single mathematical object behind every tensor in physics is the **multilinear map**.

## Definition

An **$(r, s)$-tensor at $p$** is a multilinear map
$$T: \underbrace{T^*_p M \times \cdots \times T^*_p M}_{r \text{ copies}} \times \underbrace{T_p M \times \cdots \times T_p M}_{s \text{ copies}} \to \mathbb{R}.$$
"Multilinear" means $T$ is $\mathbb{R}$-linear in each slot separately, with the others held fixed. The pair $(r, s)$ is the **rank** or **type** of the tensor; the dimension of the tensor space at $p$ is $n^{r+s}$.

Examples:

- **$(1, 0)$-tensor at $p$** = an element of $T^{**}_p M = T_p M$, i.e. a tangent vector.
- **$(0, 1)$-tensor at $p$** = an element of $T^*_p M$, a covector.
- **$(0, 2)$-tensor at $p$** = a bilinear form on $T_p M$. The metric $g_p$ is one of these.
- **$(1, 1)$-tensor at $p$** = a linear map $T_p M \to T_p M$, equivalently a bilinear form on $T^*_p M \times T_p M$. The identity, every endomorphism.
- **$(0, 0)$-tensor at $p$** = a scalar.

The space of $(r, s)$-tensors at $p$ is denoted $T^r_s(T_p M)$ or $\bigotimes^r T_p M \otimes \bigotimes^s T^*_p M$.

## Tensor product

Given an $(r_1, s_1)$-tensor $S$ and an $(r_2, s_2)$-tensor $T$ at $p$, their **tensor product** is the $(r_1 + r_2, s_1 + s_2)$-tensor
$$(S \otimes T)(\alpha_1, \ldots, \alpha_{r_1+r_2}, v_1, \ldots, v_{s_1+s_2}) := S(\alpha_1, \ldots, \alpha_{r_1}, v_1, \ldots, v_{s_1})\; T(\alpha_{r_1+1}, \ldots, v_{s_1+1}, \ldots).$$
The product is bilinear and associative but not commutative.

Concretely, $\partial_\mu \otimes \partial_\nu$ is a $(2, 0)$-tensor: it eats two covectors and returns the product of their pairings with $\partial_\mu$ and $\partial_\nu$ respectively. A general $(2, 0)$-tensor is a linear combination
$$T = T^{\mu\nu}\, \partial_\mu \otimes \partial_\nu.$$

## Coordinate basis

The basis of $T^r_s(T_p M)$ induced by a chart $x^\mu$ is the set of all tensor-product combinations
$$\partial_{\mu_1} \otimes \cdots \otimes \partial_{\mu_r} \otimes dx^{\nu_1} \otimes \cdots \otimes dx^{\nu_s},$$
indexed by $(\mu_1, \ldots, \mu_r, \nu_1, \ldots, \nu_s) \in \{1, \ldots, n\}^{r+s}$. An arbitrary $(r, s)$-tensor at $p$ is
$$T = T^{\mu_1 \cdots \mu_r}{}_{\nu_1 \cdots \nu_s}\; \partial_{\mu_1} \otimes \cdots \otimes \partial_{\mu_r} \otimes dx^{\nu_1} \otimes \cdots \otimes dx^{\nu_s}.$$
The component array $T^{\mu_1 \cdots}{}_{\nu_1 \cdots}$ has $n^{r+s}$ entries.

## Contraction

Given an $(r, s)$-tensor with $r, s \geq 1$, **contraction** of an upper index with a lower index produces an $(r-1, s-1)$-tensor. In components, pick one upper slot and one lower slot, relabel both with a single dummy index $\lambda$, and sum:
$$T^{\mu_1 \cdots \mu_r}{}_{\nu_1 \cdots \nu_s} \;\longmapsto\; T^{\mu_1 \cdots \lambda \cdots \mu_r}{}_{\nu_1 \cdots \lambda \cdots \nu_s} \;=\; \sum_{\lambda=1}^{n} T^{\cdots \lambda \cdots}{}_{\cdots \lambda \cdots}.$$
The Einstein summation convention bakes the sum in: any index appearing once up and once down is summed. The pairing $\omega_\mu v^\mu$ is the contraction of $\omega \otimes v$.

## Tensor fields

A **tensor field** of type $(r, s)$ on $M$ is a smooth section of the corresponding tensor bundle — a smooth assignment $p \mapsto T_p \in T^r_s(T_p M)$. In coordinates, the components $T^{\mu_1 \cdots}{}_{\nu_1 \cdots}(x)$ are smooth functions on the chart's domain. (See [tensor field](note:tensor-field).)

The tensor product and contraction operations work pointwise — a tensor field becomes a $C^\infty(M)$-multilinear map on vector fields and 1-forms, which is one diagnostic for whether a candidate operation is tensorial (next page).
