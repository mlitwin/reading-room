---
title: Two languages, side by side
---

The same object goes by different names depending on the audience. This page is a translation table between the physicist's index notation and the mathematician's coordinate-free notation, plus the special role of fully antisymmetric covariant tensors as differential forms.

## Translation table

| Object | Index notation | Coordinate-free |
|---|---|---|
| Tangent vector | $v^\mu$ | $v \in T_p M$ |
| Covector | $\omega_\mu$ | $\omega \in T^*_p M$ |
| $(r, s)$-tensor | $T^{\mu_1 \cdots \mu_r}{}_{\nu_1 \cdots \nu_s}$ | $T \in \bigotimes^r T_p M \otimes \bigotimes^s T^*_p M$ |
| Metric | $g_{\mu\nu}$ | $g \in \mathrm{Sym}^2(T^*_p M)$ |
| Inverse metric | $g^{\mu\nu}$ | $g^{-1} \in \mathrm{Sym}^2(T_p M)$ |
| Vector field | $X^\mu(x)$ | $X \in \mathfrak{X}(M)$ |
| 1-form | $\omega_\mu(x)$ | $\omega \in \Omega^1(M)$ |
| $k$-form (antisymm. $(0, k)$-tensor) | $\omega_{[\mu_1 \cdots \mu_k]}$ | $\omega \in \Omega^k(M)$ |
| Pairing | $\omega_\mu v^\mu$ | $\omega(v)$ |
| Tensor product | $S^\mu{}_\nu\, T^\rho{}_\sigma$ | $S \otimes T$ |
| Contraction | set indices equal + sum | $\mathrm{tr}_{(i, j)} T$ |
| Pushforward | $(F_* v)^{\mu'} = \frac{\partial F^{\mu'}}{\partial x^\nu}\, v^\nu$ | $F_* v$ |
| Pullback (of a 1-form) | $(F^* \omega)_\nu = \frac{\partial F^{\mu'}}{\partial x^\nu}\, \omega'_{\mu'}$ | $F^* \omega$ |

## Up versus down: where the indices go

The position of an index — up for a $T_p M$ slot, down for a $T^*_p M$ slot — encodes the tensor's type. The pairing rule (sum exactly one up with exactly one down) makes indexed expressions chart-independent. Without a metric, you cannot freely move indices up and down; that operation requires the **musical isomorphisms**, covered in the [metric section](../08-metric/02-raising-and-lowering.md).

A useful identity that has nothing to do with the metric:
$$\partial_\mu \otimes dx^\mu = \mathrm{id}_{T_p M},$$
the identity $(1, 1)$-tensor. Its components are $\delta^\mu_\nu$ (the Kronecker delta), and it transforms to the same Kronecker delta in every chart — the unique tensor with the property that it equals itself under any change of coordinates.

## $k$-forms: the antisymmetric special case

A **$k$-form** is a $(0, k)$-tensor that is fully antisymmetric in its arguments:
$$\omega(v_{\sigma(1)}, \ldots, v_{\sigma(k)}) = \mathrm{sgn}(\sigma)\, \omega(v_1, \ldots, v_k)$$
for every permutation $\sigma \in S_k$. Equivalently, $\omega_{\mu_1 \cdots \mu_k}$ is unchanged under the antisymmetrization operator $[\,\cdot\,]$:
$$\omega_{\mu_1 \cdots \mu_k} = \omega_{[\mu_1 \cdots \mu_k]}.$$

The space of $k$-forms at $p$ has dimension $\binom{n}{k}$ (zero for $k > n$). The basis is
$$dx^{\mu_1} \wedge \cdots \wedge dx^{\mu_k}, \qquad 1 \leq \mu_1 < \cdots < \mu_k \leq n,$$
with the **wedge product**
$$dx^{\mu_1} \wedge \cdots \wedge dx^{\mu_k} := \sum_{\sigma \in S_k} \mathrm{sgn}(\sigma)\; dx^{\mu_{\sigma(1)}} \otimes \cdots \otimes dx^{\mu_{\sigma(k)}}.$$
A general $k$-form on $M$ is $\omega = \tfrac{1}{k!}\, \omega_{\mu_1 \cdots \mu_k}\, dx^{\mu_1} \wedge \cdots \wedge dx^{\mu_k}$, with $\omega_{\mu_1 \cdots \mu_k}$ totally antisymmetric.

The full machinery — wedge product, exterior derivative $d$, pullback, integration — is developed in [Part I](../03-differential-forms/index.md), in the same $\tfrac{1}{k!}$ [convention](note:wedge-convention) used here. For GR purposes the wedge product and $d$ recur in two places: the volume form built from the metric, and the with-torsion connection of [Einstein–Cartan](../10-general-relativity/03-einstein-cartan.md).

## Symmetric tensors

Mirror construction: a **symmetric $k$-tensor** has $T_{\mu_1 \cdots \mu_k} = T_{(\mu_1 \cdots \mu_k)}$. The metric is the most important example. The dimension of the symmetric $(0, k)$-space is $\binom{n + k - 1}{k}$, larger than the $k$-form space for $k \geq 2$. Symmetric and antisymmetric tensors together span the rank-$k$ space only for $k \leq 2$; for higher $k$, there are mixed-symmetry tensors as well (Young-diagram decomposition).

This will not matter again until the Riemann tensor (which has a non-trivial mixed symmetry — antisymmetric in two pairs of indices, with the first Bianchi identity giving a third constraint).
