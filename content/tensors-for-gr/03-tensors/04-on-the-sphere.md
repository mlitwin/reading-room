---
title: On the sphere
---

Two tensors on $S^2$ worked out in components: a $(1, 1)$-tensor (an endomorphism of the tangent bundle) and a 2-form (the dimension-$2$ top form). Both prefigure the metric and volume form of [the next section](../04-metric/index.md), but the construction here uses only the chart structure — no metric required.

## A $(1, 1)$-tensor: $90^\circ$ rotation

In the spherical chart $(\theta, \varphi)$, define $J$ by
$$J(\partial_\theta) = \frac{1}{\sin\theta}\, \partial_\varphi, \qquad J(\partial_\varphi) = -\sin\theta\, \partial_\theta.$$
Read $J$ as a $(1, 1)$-tensor: it eats one vector and returns one vector, equivalently is a linear map $T_p S^2 \to T_p S^2$ at each point. Its components are
$$J^\theta{}_\varphi = -\sin\theta, \qquad J^\varphi{}_\theta = \frac{1}{\sin\theta}, \qquad J^\theta{}_\theta = J^\varphi{}_\varphi = 0.$$
Squaring: $J^2 = -\mathrm{id}$. So $J$ is a **complex structure** — a global $90^\circ$ rotation in the tangent plane at every point, defined without ever choosing a metric.

This is a genuine tensor field: a chart change to the stereographic coordinates $(x, y)$ would give different component functions $J^x{}_x$, $J^x{}_y$, etc., but the same intrinsic object. (Computing those components from the transformation rule is an exercise.)

Under contraction of $J$ with itself,
$$\mathrm{tr}\, J = J^\mu{}_\mu = 0,$$
the trace vanishes identically; $J$ is traceless. This is invariant: trace of a $(1, 1)$-tensor is a scalar, and zero in one chart is zero in every chart.

## A 2-form: the area form

The 2-form
$$\omega = \sin\theta\, d\theta \wedge d\varphi$$
on $S^2$ in the spherical chart eats two tangent vectors and returns a number. Plugged in:
$$\omega(\partial_\theta, \partial_\varphi) = \sin\theta\, [d\theta(\partial_\theta)\, d\varphi(\partial_\varphi) - d\theta(\partial_\varphi)\, d\varphi(\partial_\theta)] = \sin\theta.$$
The component array is $\omega_{\theta\varphi} = \sin\theta$, $\omega_{\varphi\theta} = -\sin\theta$, $\omega_{\theta\theta} = \omega_{\varphi\varphi} = 0$ — fully antisymmetric, as required of a 2-form.

This form measures the area of an infinitesimal coordinate rectangle: a small patch $[\theta, \theta + d\theta] \times [\varphi, \varphi + d\varphi]$ has area $\sin\theta\, d\theta\, d\varphi$, which integrates over the whole sphere to $4\pi$. The same form will reappear with a metric explanation: $\omega = \sqrt{\det g}\, d\theta \wedge d\varphi$ is the canonical volume form.

In the stereographic chart $(x, y)$, the chain rule gives
$$\omega = \frac{4}{(1 + x^2 + y^2)^2}\, dx \wedge dy.$$
Again, same tensor, different components.

## Transformation diagnostic

Both objects above transform correctly: changing chart, recomputing the components from the rule, and checking that the result is the same as starting fresh in the new chart, is a finite (and tedious) check. The defining property of a tensor — the multiplicative transformation law of [the previous page](02-coordinate-components.md) — is what licenses calling these objects intrinsic features of the sphere rather than chart artifacts.

The next section introduces the round metric, which lets us assign a *length* to a tangent vector, a *length* to a covector via the dual metric, and gives a unified construction of $J$ (as the rotation associated to the metric and orientation) and $\omega$ (as the metric volume form).
