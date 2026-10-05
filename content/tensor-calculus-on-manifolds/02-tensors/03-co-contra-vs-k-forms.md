---
title: Two languages, side by side
---

A translation table between the physicist's index notation and the mathematician's coordinate-free notation, and the place of differential forms among tensors.

## Translation table

| Object | Index notation | Coordinate-free |
|---|---|---|
| Tangent vector | $v^\mu$ | $\tens{v} \in T_p M$ |
| Covector | $\omega_\mu$ | $\tens{\omega} \in T^*_p M$ |
| $(r, s)$-tensor | $T^{\mu_1 \cdots \mu_r}{}_{\nu_1 \cdots \nu_s}$ | $\tens{T} \in \bigotimes^r T_p M \otimes \bigotimes^s T^*_p M$ |
| Metric | $g_{\mu\nu}$ | $\tens{g} \in \mathrm{Sym}^2(T^*_p M)$ |
| Inverse metric | $g^{\mu\nu}$ | $\tens{g}^{-1} \in \mathrm{Sym}^2(T_p M)$ |
| Vector field | $X^\mu(x)$ | $\tens{X} \in \mathfrak{X}(M)$ |
| 1-form | $\omega_\mu(x)$ | $\tens{\omega} \in \Omega^1(M)$ |
| $k$-form (antisymm. $(0, k)$-tensor) | $\omega_{[\mu_1 \cdots \mu_k]}$ | $\tens{\omega} \in \Omega^k(M)$ |
| Pairing | $\omega_\mu v^\mu$ | $\tens{\omega}(\tens{v})$ |
| Tensor product | $S^\mu{}_\nu\, T^\rho{}_\sigma$ | $\tens{S} \otimes \tens{T}$ |
| Contraction | set indices equal + sum | $\mathrm{tr}_{(i, j)} \tens{T}$ |
| Pushforward | $(F_* \tens{v})^{\mu'} = \frac{\partial F^{\mu'}}{\partial x^\nu}\, v^\nu$ | $F_* \tens{v}$ |
| Pullback (of a 1-form) | $(F^* \tens{\omega})_\nu = \frac{\partial F^{\mu'}}{\partial x^\nu}\, \omega'_{\mu'}$ | $F^* \tens{\omega}$ |

## Up versus down: where the indices go

The position of an index — up for a $T_p M$ slot, down for a $T^*_p M$ slot — encodes the tensor's type. The pairing rule (sum exactly one up with exactly one down) makes indexed expressions chart-independent. Without a metric, you cannot freely move indices up and down; that operation requires the [**musical isomorphisms**](note:musical-isomorphism), covered in the [metric chapter](../03-metric/02-raising-and-lowering.md).

A useful identity that has nothing to do with the metric:
$$\partial_\mu \otimes dx^\mu = \mathrm{id}_{T_p M},$$
the identity $(1, 1)$-tensor. Its components are $\delta^\mu_\nu$ (the Kronecker delta), and the transformation law returns the same Kronecker delta in every chart — the rare tensor whose component array never changes under a change of coordinates.

## $k$-forms: the antisymmetric special case

A **$k$-form** is a $(0, k)$-tensor that is fully antisymmetric in its arguments:
$$\tens{\omega}(\tens{v}_{\sigma(1)}, \ldots, \tens{v}_{\sigma(k)}) = \mathrm{sgn}(\sigma)\, \tens{\omega}(\tens{v}_1, \ldots, \tens{v}_k)$$
for every permutation $\sigma \in S_k$. Equivalently, $\omega_{\mu_1 \cdots \mu_k}$ is unchanged under the antisymmetrization operator $[\,\cdot\,]$:
$$\omega_{\mu_1 \cdots \mu_k} = \omega_{[\mu_1 \cdots \mu_k]}.$$

The space of $k$-forms at $p$ has dimension $\binom{n}{k}$, zero for $k > n$. The wedge product, the [exterior derivative](note:exterior-derivative), pullback and integration are developed in [chapter 6](../06-differential-forms/01-k-forms-and-wedge.md), with the same $\tfrac{1}{k!}$ [convention](note:wedge-convention) for components. In the physics chapters they recur in the metric volume form, Maxwell's $\tens{F} = d\tens{A}$, and the structure equations of [Einstein–Cartan](../15-general-relativity/03-einstein-cartan.md) gravity.

## Symmetric tensors

A **symmetric $k$-tensor** has $T_{\mu_1 \cdots \mu_k} = T_{(\mu_1 \cdots \mu_k)}$. The metric is the most important example. The dimension of the symmetric $(0, k)$-space is $\binom{n + k - 1}{k}$, larger than the $k$-form space for $k \geq 2$. Symmetric and antisymmetric tensors together span the rank-$k$ space only for $k \leq 2$; for higher $k$, there are mixed-symmetry tensors as well (Young-diagram decomposition).

Mixed symmetry next matters for the [Riemann tensor](note:riemann-tensor), which is antisymmetric within each of two index pairs and obeys the first Bianchi identity as a further constraint.
