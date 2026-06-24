---
title: Coordinates and constraints
---

**Coordinate invariance.** Under a smooth change of generalized coordinates $\tilde q = \tilde q(q)$ with $\dot{\tilde q}^i = (\partial \tilde q^i / \partial q^j) \dot q^j$, the Euler–Lagrange equations transform covariantly: they hold for $\tilde L(\tilde q, \dot{\tilde q}, t) := L(q(\tilde q), \dot q(\tilde q, \dot{\tilde q}), t)$ as well. This is the structural advantage of the Lagrangian formulation over Newton's — you don't have to track how forces decompose in the new frame.

**Holonomic constraints.** A constraint $f(q, t) = 0$ cuts the configuration space down to a submanifold $\tilde Q$. Choose coordinates $\tilde q^1, \ldots, \tilde q^k$ on $\tilde Q$ (so $k = n - 1$ for one constraint, etc.); the reduced Lagrangian $\tilde L(\tilde q, \dot{\tilde q}, t) = L(q(\tilde q), \dot q(\tilde q, \dot{\tilde q}), t)$ has its own EL equations on $\tilde Q$. Constraint forces never appear explicitly.

**Lagrange multipliers** (for explicit constraint forces or for nonholonomic cases). The EL equations on the full $Q$ become
$$\frac{d}{dt}\frac{\partial L}{\partial \dot q^i} - \frac{\partial L}{\partial q^i} = \lambda \frac{\partial f}{\partial q^i},$$
with $f(q, t) = 0$ enforced. The multiplier $\lambda$ is the magnitude of the constraint force.

**[Cyclic (or ignorable) coordinate](note:cyclic-coordinate).** If $\partial L / \partial q^i = 0$ for some coordinate $q^i$, the EL equation for that coordinate becomes
$$\frac{d}{dt}\frac{\partial L}{\partial \dot q^i} = 0,$$
so the conjugate momentum $p_i = \partial L / \partial \dot q^i$ is conserved. (This is the simplest case of Noether's theorem.)

**Example: pendulum.** A mass $m$ on a rigid rod of length $\ell$ in a uniform gravitational field. Configuration: angle $\theta$ from vertical (so $Q = S^1$).
$$L = \tfrac{1}{2} m \ell^2 \dot\theta^2 - m g \ell (1 - \cos\theta).$$
EL: $\ell \ddot\theta + g \sin\theta = 0$. No mention of the constraint force in the rod.

**Example: free particle on a sphere.** $Q = S^2$, $L = \tfrac{1}{2} m R^2 (\dot\theta^2 + \sin^2\theta\, \dot\varphi^2)$. EL gives geodesics on the sphere — great circles. The EL equations here are the same geodesic equations derived from the [Levi-Civita connection of the round metric](../../tensor-calculus-on-manifolds/09-connection-and-curvature/04-on-the-sphere.md).
