---
title: Orientation and integration
---

An **orientation** on an $n$-manifold $M$ is a smooth, nowhere-vanishing $n$-form $\tens{\Omega} \in \Omega^n(M)$, taken up to multiplication by an everywhere-positive smooth function. Two such forms give the same orientation iff their ratio is positive everywhere on $M$.

A manifold that admits an orientation is **orientable**. Examples: $\mathbb{R}^n$, $S^n$, $T^n$, every [Lie group](note:lie-group), every complex manifold. Non-examples: the Möbius strip, the Klein bottle, $\mathbb{RP}^{2k}$.

Equivalently, an orientation is a continuous choice of "right-handed" bases of the tangent spaces; on a connected orientable $M$ there are exactly two.

**Oriented chart.** A chart $(U, \varphi)$ is **positively oriented** if $dx^1 \wedge \cdots \wedge dx^n$ agrees with the orientation of $M$ on $U$.

**Integration of $n$-forms.** For a positively oriented chart $(U, \varphi)$ and a [compactly supported](note:compact-support) $n$-form
$$\tens{\omega} = f\, dx^1 \wedge \cdots \wedge dx^n \in \Omega^n_c(U),$$
define
$$\int_M \tens{\omega} := \int_{\varphi(U)} (f \circ \varphi^{-1})\, dx^1 \cdots dx^n,$$
the right side being an ordinary Riemann/Lebesgue integral on $\mathbb{R}^n$.

For a general $\tens{\omega} \in \Omega^n_c(M)$, choose a [partition of unity](note:partition-of-unity) $\{\rho_\alpha\}$ subordinate to a positively oriented atlas $\{(U_\alpha, \varphi_\alpha)\}$ and set
$$\int_M \tens{\omega} := \sum_\alpha \int_{U_\alpha} \rho_\alpha \, \tens{\omega}.$$
Independence of the partition and the atlas follows from the change-of-variables formula in $\mathbb{R}^n$. Positive orientation guarantees the Jacobian determinant is positive.

**Change of variables on manifolds.** For an orientation-preserving diffeomorphism $F: N \to M$,
$$\int_N F^* \tens{\omega} = \int_M \tens{\omega}.$$

Integrals of forms are thus chart-independent by construction, which is why one integrates forms rather than functions. A metric supplies the form that integrates functions, the volume form ([next page](02-volume-form-and-hodge-star.md)).
