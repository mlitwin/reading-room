---
title: Minkowski spacetime
---

## The metric

[Minkowski space](note:minkowski-space) is $\mathbb{R}^4$ with coordinates $x^\mu = (t, x, y, z)$ and the flat Lorentzian metric
$$\tens{\eta} = -dt^2 + dx^2 + dy^2 + dz^2, \qquad \eta_{\mu\nu} = \mathrm{diag}(-1, 1, 1, 1),$$
in units with $c = 1$. With $c$ restored, $\tens{\eta} = -c^2 dt^2 + dx^2 + dy^2 + dz^2$. All Christoffel symbols vanish in these inertial coordinates, so the Riemann tensor is zero.

Every tangent vector has a causal type ([chapter 11](../11-metric/01-the-metric-tensor.md)): timelike ($\tens{\eta}(\tens{v}, \tens{v}) < 0$), null, or spacelike. The null vectors at each point form the lightcone.

## Lorentz and Poincaré transformations

The [isometries](note:isometry) of $\tens{\eta}$ are the **Poincaré transformations** $x \mapsto \Lambda x + a$. Here $a$ is a translation and $\Lambda$ a **Lorentz transformation**, a linear map with
$$\Lambda^\mu{}_\rho\, \Lambda^\nu{}_\sigma\, \eta_{\mu\nu} = \eta_{\rho\sigma}, \qquad \text{i.e. } \Lambda^{\mathsf T} \eta\, \Lambda = \eta.$$
They form a 10-dimensional Lie group: 4 translations, 3 rotations, 3 boosts. Its Lie algebra is spanned by the ten [Killing fields](note:killing-vector) of $\tens{\eta}$, the maximum $n(n+1)/2$ for $n = 4$. A boost with velocity $v$ along $x$ is
$$t' = \gamma\,(t - v x), \qquad x' = \gamma\,(x - v t), \qquad \gamma = (1 - v^2)^{-1/2}.$$

**Galilean limit.** With $c$ restored, a boost reads $t' = \gamma(t - vx/c^2)$, $x' = \gamma(x - vt)$. As $c \to \infty$ it reduces to the Galilean boost $t' = t$, $x' = x - vt$ of [chapter 8](../08-symmetry-and-noether/02-examples.md).

## Proper time, four-velocity, four-momentum

A massive particle follows a timelike worldline $x^\mu(\lambda)$. Its [proper time](note:proper-time),
$$\tau = \int \sqrt{-\eta_{\mu\nu}\, \dot x^\mu \dot x^\nu}\; d\lambda,$$
is the time read by a clock carried along it. It does not depend on the parametrization.

- The **four-velocity** $\tens{u} = dx/d\tau$ is a unit timelike vector, $\tens{\eta}(\tens{u}, \tens{u}) = -1$. In an inertial frame, $u^\mu = \gamma\,(1, \tens{v})$.
- The **four-momentum** $\tens{p} = m\tens{u}$ has components $p^\mu = (E, \tens{p})$, with $E = \gamma m$ and spatial part $\gamma m \tens{v}$.
- It satisfies the **mass shell** relation
$$\eta^{\mu\nu}\, p_\mu p_\nu = -m^2, \qquad \text{i.e. } E^2 = \lvert \tens{p} \rvert^2 + m^2.$$

For slow particles, $E = m + \tfrac12 m v^2 + O(v^4)$: rest energy plus Newtonian kinetic energy.
