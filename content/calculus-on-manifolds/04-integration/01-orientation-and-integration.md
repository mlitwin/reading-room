---
title: Orientation and integration
---

An **orientation** on an $n$-manifold $M$ is a smooth, nowhere-vanishing $n$-form $\Omega \in \Omega^n(M)$, taken up to multiplication by an everywhere-positive smooth function. Two such forms give the same orientation iff their ratio is positive everywhere on $M$.

A manifold that admits an orientation is **orientable**. Examples: $\mathbb{R}^n$, $S^n$, $T^n$, every Lie group, every complex manifold. Non-examples: the Möbius strip, the Klein bottle, $\mathbb{RP}^{2k}$.

Equivalently, an orientation is a consistent choice of "right-handed basis" at each tangent space: a connected component of the bundle of frames.

**Oriented chart.** A chart $(U, \varphi)$ is **positively oriented** if $dx^1 \wedge \cdots \wedge dx^n$ agrees with the orientation of $M$ on $U$.

**Integration of $n$-forms.** For a positively oriented chart $(U, \varphi)$ and a compactly supported $n$-form
$$\omega = f\, dx^1 \wedge \cdots \wedge dx^n \in \Omega^n_c(U),$$
define
$$\int_M \omega := \int_{\varphi(U)} (f \circ \varphi^{-1})\, dx^1 \cdots dx^n,$$
the right side being an ordinary Riemann/Lebesgue integral on $\mathbb{R}^n$.

For a general $\omega \in \Omega^n_c(M)$, choose a partition of unity $\{\rho_\alpha\}$ subordinate to a positively oriented atlas $\{(U_\alpha, \varphi_\alpha)\}$ and set
$$\int_M \omega := \sum_\alpha \int_{U_\alpha} \rho_\alpha \, \omega.$$
Independence of the choice of partition and atlas is exactly the change-of-variables formula in $\mathbb{R}^n$ (with Jacobian sign tracked by the orientation).

**Change of variables on manifolds.** For an orientation-preserving diffeomorphism $F: N \to M$,
$$\int_N F^* \omega = \int_M \omega.$$

Integration of forms is reparametrization-invariant by construction — that's the whole motivation for using forms instead of functions.
