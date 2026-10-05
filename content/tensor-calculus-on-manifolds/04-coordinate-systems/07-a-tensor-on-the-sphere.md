---
title: A (1, 1)-tensor on the sphere
---

A $(1, 1)$-tensor on $S^2$ worked out in components: rotation by $90^\circ$ in each tangent plane.

## Definition and components

In the spherical chart $(\theta, \varphi)$, define $\tens{J}$ by
$$\tens{J}(\partial_\theta) = \frac{1}{\sin\theta}\, \partial_\varphi, \qquad \tens{J}(\partial_\varphi) = -\sin\theta\, \partial_\theta.$$
At each point $\tens{J}$ is a linear map $T_p S^2 \to T_p S^2$, so it is a $(1, 1)$-tensor field ([chapter 2](../02-tensors/01-multilinear-and-rank.md)). Its components are
$$J^\theta{}_\varphi = -\sin\theta, \qquad J^\varphi{}_\theta = \frac{1}{\sin\theta}, \qquad J^\theta{}_\theta = J^\varphi{}_\varphi = 0.$$

- **Rotation.** $\partial_\theta$ and $\partial_\varphi / \sin\theta$ form an orthonormal basis of the [round metric](06-the-round-metric.md), and $\tens{J}$ turns the first into the second and the second into minus the first. So $\tens{J}$ is rotation by $90^\circ$, and $\tens{g}(\tens{J}\tens{v}, \tens{J}\tens{w}) = \tens{g}(\tens{v}, \tens{w})$.
- **Complex structure.** $\tens{J}^2 = -\mathrm{id}$, so $\tens{J}$ is an *almost complex structure*. It extends smoothly over the poles to all of $S^2$.
- **Traceless.** $\mathrm{tr}\, \tens{J} = J^\mu{}_\mu = 0$. The trace of a $(1, 1)$-tensor is a scalar, so this holds in every chart.

**Without a metric.** The definition above uses only the chart. The metric is what explains it: $\tens{J}$ is the rotation determined by the round metric and the orientation.

## In the stereographic chart

The [transformation law](note:tensor-transformation-law) carries the components to any other chart. In the [stereographic chart](05-the-stereographic-chart.md), where the round metric is a multiple of $dx^2 + dy^2$, they are constant:
$$\tens{J}(\partial_x) = \partial_y, \qquad \tens{J}(\partial_y) = -\partial_x.$$
Same tensor, different components. A direct computation in the new chart agrees with the transformed components, which is what makes $\tens{J}$ a feature of the sphere rather than of a chart.
