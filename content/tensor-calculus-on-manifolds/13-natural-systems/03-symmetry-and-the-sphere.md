---
title: Symmetry and the sphere
---

## Killing fields are Noether symmetries

For a natural system, the flow of $\tens{\xi}$ is a symmetry of $L$ exactly when it preserves both terms:

- $\tens{\xi}$ is a [Killing field](note:killing-vector) of the kinetic metric, $\Lie_{\tens{\xi}}\, \tens{g} = 0$;
- $\tens{\xi}$ preserves the potential, $\tens{\xi}(V) = 0$.

The [Noether charge](../08-symmetry-and-noether/01-noethers-theorem.md) is then the generator with its index lowered, paired with the velocity:
$$J_\xi = p_i\, \xi^i = g_{ij}\, \xi^i \dot q^j = \tens{g}(\tens{\xi}, \dot q).$$
A direct check uses covariant Newton and the antisymmetry of $\nabla \tens{\xi}$ ([chapter 11](../11-metric/03-killing-vectors.md)):
$$\frac{d}{dt}\, \tens{g}(\tens{\xi}, \dot q) = \tens{g}(\nabla_{\dot q}\tens{\xi}, \dot q) + \tens{g}(\tens{\xi}, \nabla_{\dot q}\dot q) = 0 - \tens{g}(\tens{\xi}, \operatorname{grad} V) = -\tens{\xi}(V) = 0.$$
With $Q$ spacetime and $V = 0$, this is the geodesic Killing charge $\xi_\mu \dot x^\mu$ of chapter 11.

## The particle on the sphere

A free particle of mass $m$ on the sphere of radius $R$ has kinetic metric $mR^2$ times the round metric ([page 1](01-kinetic-metric.md)). Its Euler–Lagrange equations are the round-sphere geodesic equations, whose solutions are great circles traversed at constant speed ([chapter 12](../12-connection-and-curvature/05-on-the-sphere.md)).

The round sphere has three Killing fields, one per rotation axis ([chapter 11](../11-metric/03-killing-vectors.md)):
$$\tens{\xi}_Z = \partial_\varphi, \quad \tens{\xi}_X = -\sin\varphi\, \partial_\theta - \cot\theta\cos\varphi\, \partial_\varphi, \quad \tens{\xi}_Y = \cos\varphi\, \partial_\theta - \cot\theta\sin\varphi\, \partial_\varphi.$$
Their charges $\tens{g}(\tens{\xi}_X, \dot q)$, $\tens{g}(\tens{\xi}_Y, \dot q)$, $\tens{g}(\tens{\xi}_Z, \dot q)$ are the three components of the angular momentum $\tens{L}$ about the center. All three are conserved, so $\tens{L}$ is a fixed vector. Each orbit lies in the plane through the center perpendicular to $\tens{L}$, which is another way to see that it is a great circle. Only $\tens{\xi}_Z$ shows up as a cyclic coordinate in the $(\theta, \varphi)$ chart; the other two are symmetries the chart does not display.

## The spherical pendulum

Add gravity along $-Z$: $V = mgR\cos\theta$, with $\theta$ the polar angle from $+Z$. The kinetic metric is unchanged, but $V$ is invariant only under rotations about the vertical: $\tens{\xi}_Z(V) = 0$, while $\tens{\xi}_X(V), \tens{\xi}_Y(V) \neq 0$. One charge survives, $L_Z = mR^2 \sin^2\theta\, \dot\varphi$, along with the energy $E = T + V$. Two conserved quantities on a two-dimensional configuration space make the system integrable. It reduces to one-dimensional motion in $\theta$ with an effective potential, the same reduction that [Schwarzschild](../16-general-relativity/02-schwarzschild.md) orbits undergo.
