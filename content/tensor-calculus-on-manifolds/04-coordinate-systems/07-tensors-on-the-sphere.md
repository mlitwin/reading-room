---
title: On the sphere
---

Two tensors on $S^2$ worked out in components: a $(1, 1)$-tensor (an endomorphism of the tangent bundle) and [a 2-form](note:differential-form) (the dimension-$2$ top form). Both prefigure the metric and volume form of [the next chapter](../03-metric/index.md), but the construction here uses only the chart structure — no metric required.

## A $(1, 1)$-tensor: $90^\circ$ rotation

In the spherical chart $(\theta, \varphi)$, define $\tens{J}$ by
$$\tens{J}(\partial_\theta) = \frac{1}{\sin\theta}\, \partial_\varphi, \qquad \tens{J}(\partial_\varphi) = -\sin\theta\, \partial_\theta.$$
Read $\tens{J}$ as a $(1, 1)$-tensor: it eats one vector and returns one vector, equivalently is a linear map $T_p S^2 \to T_p S^2$ at each point. Its components are
$$J^\theta{}_\varphi = -\sin\theta, \qquad J^\varphi{}_\theta = \frac{1}{\sin\theta}, \qquad J^\theta{}_\theta = J^\varphi{}_\varphi = 0.$$
Squaring: $\tens{J}^2 = -\mathrm{id}$, so $\tens{J}$ is an **almost complex structure**; it extends smoothly over the poles to all of $S^2$. With respect to the round metric of chapter 3 it is rotation by $90^\circ$, but its definition uses no metric.

It is a genuine tensor field: other charts give other component functions for the same object. In the stereographic chart, where the round metric is a multiple of $dx^2 + dy^2$ ([chapter 4](06-the-round-metric.md)), the components are constant: $\tens{J}(\partial_x) = \partial_y$ and $\tens{J}(\partial_y) = -\partial_x$.

Contracting the upper index of $\tens{J}$ against its lower one,
$$\mathrm{tr}\, \tens{J} = J^\mu{}_\mu = 0,$$
so $\tens{J}$ is traceless. The trace of a $(1, 1)$-tensor is a scalar, so this holds in every chart.

## A 2-form: the area form

The 2-form
$$\tens{\omega} = \sin\theta\, d\theta \wedge d\varphi$$
on $S^2$ in the spherical chart eats two tangent vectors and returns a number. Plugged in:
$$\tens{\omega}(\partial_\theta, \partial_\varphi) = \sin\theta\, [d\theta(\partial_\theta)\, d\varphi(\partial_\varphi) - d\theta(\partial_\varphi)\, d\varphi(\partial_\theta)] = \sin\theta.$$
The component array is $\omega_{\theta\varphi} = \sin\theta$, $\omega_{\varphi\theta} = -\sin\theta$, $\omega_{\theta\theta} = \omega_{\varphi\varphi} = 0$ — fully antisymmetric, as required of a 2-form.

This form measures the area of an infinitesimal coordinate rectangle: a small patch $[\theta, \theta + d\theta] \times [\varphi, \varphi + d\varphi]$ has area $\sin\theta\, d\theta\, d\varphi$, which integrates over the whole sphere to $4\pi$. The same form will reappear with a metric explanation: $\tens{\omega} = \sqrt{\det g}\, d\theta \wedge d\varphi$ is the canonical [volume form](note:volume-form).

In the stereographic chart $(x, y)$, the chain rule gives
$$\tens{\omega} = \frac{4}{(1 + x^2 + y^2)^2}\, dx \wedge dy.$$
Again, same tensor, different components.

## Transformation diagnostic

For either object, transforming the standard-chart components by the [transformation law](note:tensor-transformation-law) of [the previous page](../02-tensors/02-coordinate-components.md) reproduces a direct computation in the new chart. That law is what makes them features of the sphere rather than artifacts of a chart.

The next chapter introduces the round metric, which lets us assign a *length* to a tangent vector, a *length* to a covector via the dual metric, and gives a unified construction of $\tens{J}$ (as the rotation associated to the metric and orientation) and $\tens{\omega}$ (as the metric volume form).
