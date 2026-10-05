---
title: The stereographic chart
---

A third chart on $S^2$, which covers the poles and seam that the spherical charts miss. It returns with the round metric, where it is conformally flat ([page 6](06-the-round-metric.md)), and with the complex structure $\tens{J}$ ([page 7](07-a-tensor-on-the-sphere.md)).

## The chart

Stereographic projection from the south pole gives
$$\psi_S(p) = (x, y) = \left( \frac{X}{1 + Z}, \; \frac{Y}{1 + Z} \right),$$
covering everything except the south pole, including the north pole and the seam the spherical chart misses. (Projection from the north pole covers the south pole; the two form an atlas.) With the parametrization
$$\Phi_S := \psi_S^{-1}, \qquad \Phi_S(x, y) = \frac{(2x,\; 2y,\; 1 - x^2 - y^2)}{1 + x^2 + y^2},$$
the basis $\{\partial_x, \partial_y\}$ at $p$ is, embedded, $\partial_x = \partial \Phi_S / \partial x$ and $\partial_y = \partial \Phi_S / \partial y$. They span the same tangent space $T_p S^2$ as $\partial_\theta, \partial_\varphi$, but they are a different basis, so a vector has different components in it.

## Components across charts

The vector field $\tens{V} = \partial_\varphi$ (rotation about the $Z$-axis) has stereographic components given by the Jacobian:
$$V'^{x} = \frac{\partial x}{\partial \theta}\, V^\theta + \frac{\partial x}{\partial \varphi}\, V^\varphi, \qquad V'^{y} = \frac{\partial y}{\partial \theta}\, V^\theta + \frac{\partial y}{\partial \varphi}\, V^\varphi.$$
With $V^\theta = 0, V^\varphi = 1$, this evaluates (using $x = \sin\theta\cos\varphi / (1+\cos\theta)$, $y = \sin\theta\sin\varphi / (1+\cos\theta)$) to
$$V'^{x} = -y, \qquad V'^{y} = x,$$
the rotation field of the plane. One vector field, two sets of component functions, related by the [vector transformation rule](note:tensor-transformation-law).

## A covector field

The differential of the height function $Z = \cos\theta$ is $dZ = -\sin\theta\, d\theta$. It pairs with $\partial_\varphi$ to give zero, since $Z$ is invariant under rotation about the $Z$-axis, and with $\partial_\theta$ to give $-\sin\theta$, the rate of change of $Z$ as $\theta$ increases. In the stereographic chart, $Z = (1 - x^2 - y^2)/(1 + x^2 + y^2)$ and
$$dZ = -\frac{4\,(x\, dx + y\, dy)}{(1 + x^2 + y^2)^2}.$$
Pairing is metric-free: $dZ(\tens{V}) = 0$ in either chart. With the metric, $(dZ)^\sharp = \operatorname{grad} Z$ is the vector pointing up the sphere.
