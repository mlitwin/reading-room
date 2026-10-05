---
title: Multilinear maps and rank
---

The single mathematical object behind every tensor in physics is the **multilinear map**.

## Definition

An **$(r, s)$-tensor at $p$** is a multilinear map
$$\tens{T}: \underbrace{T^*_p M \times \cdots \times T^*_p M}_{r \text{ copies}} \times \underbrace{T_p M \times \cdots \times T_p M}_{s \text{ copies}} \to \mathbb{R}.$$
"Multilinear" means $\tens{T}$ is $\mathbb{R}$-linear in each slot separately, with the others held fixed. The pair $(r, s)$ is the **type** of the tensor (also called its rank, though "rank" often means $r + s$); the dimension of the tensor space at $p$ is $n^{r+s}$.

Examples:

- **$(1, 0)$-tensor at $p$** = an element of $T^{**}_p M = T_p M$, i.e. a [tangent vector](note:tangent-space).
- **$(0, 1)$-tensor at $p$** = an element of $T^*_p M$, a [covector](note:cotangent-space).
- **$(0, 2)$-tensor at $p$** = a bilinear form on $T_p M$. [The metric](note:metric) $\tens{g}_p$ is one of these.
- **$(1, 1)$-tensor at $p$** = a linear map $T_p M \to T_p M$, equivalently a bilinear form on $T^*_p M \times T_p M$; for example, the identity.
- **$(0, 0)$-tensor at $p$** = a scalar.

The space of $(r, s)$-tensors at $p$ is denoted $T^r_s(T_p M)$ or $\bigotimes^r T_p M \otimes \bigotimes^s T^*_p M$.

## Tensor product

Given an $(r_1, s_1)$-tensor $\tens{S}$ and an $(r_2, s_2)$-tensor $\tens{T}$ at $p$, their **tensor product** is the $(r_1 + r_2, s_1 + s_2)$-tensor
$$(\tens{S} \otimes \tens{T})(\tens{\alpha}_1, \ldots, \tens{\alpha}_{r_1+r_2}, \tens{v}_1, \ldots, \tens{v}_{s_1+s_2}) := \tens{S}(\tens{\alpha}_1, \ldots, \tens{\alpha}_{r_1}, \tens{v}_1, \ldots, \tens{v}_{s_1})\; \tens{T}(\tens{\alpha}_{r_1+1}, \ldots, \tens{v}_{s_1+1}, \ldots).$$
The product is bilinear and associative but not commutative.

Concretely, $\partial_\mu \otimes \partial_\nu$ is a $(2, 0)$-tensor: it eats two covectors and returns the product of their pairings with $\partial_\mu$ and $\partial_\nu$ respectively. A general $(2, 0)$-tensor is a linear combination
$$\tens{T} = T^{\mu\nu}\, \partial_\mu \otimes \partial_\nu.$$

## Coordinate basis

The basis of $T^r_s(T_p M)$ induced by a chart $x^\mu$ is the set of all tensor-product combinations
$$\partial_{\mu_1} \otimes \cdots \otimes \partial_{\mu_r} \otimes dx^{\nu_1} \otimes \cdots \otimes dx^{\nu_s},$$
indexed by $(\mu_1, \ldots, \mu_r, \nu_1, \ldots, \nu_s) \in \{1, \ldots, n\}^{r+s}$. An arbitrary $(r, s)$-tensor at $p$ is
$$\tens{T} = T^{\mu_1 \cdots \mu_r}{}_{\nu_1 \cdots \nu_s}\; \partial_{\mu_1} \otimes \cdots \otimes \partial_{\mu_r} \otimes dx^{\nu_1} \otimes \cdots \otimes dx^{\nu_s}.$$
The component array $T^{\mu_1 \cdots}{}_{\nu_1 \cdots}$ has $n^{r+s}$ entries.

## Contraction

For $r, s \geq 1$, **contraction** of an upper index with a lower index turns an $(r, s)$-tensor into an $(r-1, s-1)$-tensor. In components, give the two slots the same label and sum (the summation convention does this automatically). For example,
$$T^\mu{}_{\nu\rho} \;\longmapsto\; T^\lambda{}_{\lambda\rho} = \sum_{\lambda=1}^n T^\lambda{}_{\lambda\rho}.$$
The pairing $\omega_\mu v^\mu$ is the contraction of $\tens{\omega} \otimes \tens{v}$.

## Tensor fields

A **tensor field** of type $(r, s)$ on $M$ is a smooth section of the corresponding tensor bundle — a smooth assignment $p \mapsto \tens{T}_p \in T^r_s(T_p M)$. In coordinates, the components $T^{\mu_1 \cdots}{}_{\nu_1 \cdots}(x)$ are smooth functions on the chart's domain. (See [tensor field](note:tensor-field).)

Tensor product and contraction act pointwise. Evaluated on 1-forms and vector fields, a tensor field is a $C^\infty(M)$-multilinear map, and conversely every such map is a tensor field — the abstract tensoriality test of the next page.
