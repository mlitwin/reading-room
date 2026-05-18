---
title: Examples
---

The standard conservation laws of classical mechanics are Noether currents for the standard symmetries of space and time.

**Time translation → energy.** If $\partial L / \partial t = 0$, the system is invariant under $t \mapsto t + \epsilon$. The associated conserved quantity (allowing the symmetry to act on time as well as on $q$) is
$$E = p_i \dot q^i - L = H.$$
The Hamiltonian itself.

**Spatial translation → linear momentum.** Suppose $L$ is invariant under $q \mapsto q + \epsilon c$ for a constant direction $c \in \mathbb{R}^n$. Then $\delta q^i = c^i$ and
$$Q = p_i c^i = p \cdot c.$$
Holds for every direction $c$, so the full momentum $p$ is conserved. The condition $\partial L / \partial q^i = 0$ on a coordinate is the simplest case (a cyclic coordinate).

**Rotation → angular momentum.** In $\mathbb{R}^3$, rotation about an axis $\hat n$ acts on each particle by $r_a \mapsto r_a + \epsilon\, \hat n \times r_a$, so $\delta r_a = \hat n \times r_a$. The conserved quantity is
$$Q = \sum_a p_a \cdot (\hat n \times r_a) = \hat n \cdot \sum_a (r_a \times p_a) = \hat n \cdot L,$$
the component of total angular momentum along $\hat n$. Rotational invariance of $L$ (no preferred axis) implies all components of $L$ are conserved.

**Galilean boost → center-of-mass uniform motion.** A boost $r_a \mapsto r_a + \epsilon t \hat v$ doesn't leave $L$ strictly invariant — kinetic energy picks up a piece — but $L$ changes by a total time derivative, so this is a quasi-symmetry. The conserved quantity is
$$G = \sum_a m_a (r_a - \dot r_a t) = M R_{\text{cm}} - P t,$$
where $M = \sum_a m_a$, $R_{\text{cm}}$ is the center-of-mass position, and $P$ is the total linear momentum. $G$ constant means the center of mass moves on a straight line at constant velocity.

**Scaling and beyond.** Less elementary symmetries give less elementary conserved quantities. The Laplace–Runge–Lenz vector in the Kepler problem comes from a non-obvious symmetry of the $1/r$ potential. The Runge–Lenz conservation is what makes Kepler orbits close.

The summary: classical conservation laws are not coincidences; they're the visible shadow of the symmetry group of the Lagrangian. Noether is the bridge.
