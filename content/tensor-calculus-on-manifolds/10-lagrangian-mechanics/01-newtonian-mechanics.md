---
title: Newtonian mechanics
---

Newton's framework is the flat special case of Part II: $N$ point particles in $\mathbb{R}^3$, with masses $m_A > 0$ and positions $\tens{r}_A(t)$, $A = 1, \ldots, N$. The configuration space is $Q = \mathbb{R}^{3N}$, with Cartesian coordinates. Later pages drop the Cartesian assumption, and [chapter 10](natural-systems-index.md) drops flatness.

## Laws

**N1 (inertia).** Read as a postulate: *inertial* frames exist. In them a particle subject to no net force moves with constant velocity, and N2 holds.

**N2.** For a particle with momentum $\tens{p}_A = m_A \dot{\tens{r}}_A$ and net force $\tens{F}_A$,
$$\dot{\tens{p}}_A = \tens{F}_A, \qquad \text{so } m_A \ddot{\tens{r}}_A = \tens{F}_A \text{ for constant mass.}$$
These are $3N$ second-order ODEs, or a first-order system on $\mathbb{R}^{3N} \times \mathbb{R}^{3N}$. Positions and velocities at one instant determine the motion (Picard–Lindelöf, for Lipschitz forces).

**N3 (action and reaction).** The force of $A$ on $B$ is minus the force of $B$ on $A$. The *strong* form adds that both act along $\tens{r}_A - \tens{r}_B$. Magnetic forces between moving charges violate it.

## Force as a 1-form

Force is measured by work. Moving the system with velocities $\dot{\tens{r}}_A$ does work $\sum_A \tens{F}_A \cdot \dot{\tens{r}}_A$ per unit time, which is linear in the velocity. So the forces assemble into a [1-form](note:cotangent-space) on $Q$:
$$\tens{F} = F_i\, dq^i, \qquad \tens{F}(\dot q) = \sum_A \tens{F}_A \cdot \dot{\tens{r}}_A,$$
where $q^i$ runs over the $3N$ Cartesian coordinates. The **generalized forces** $F_i$ carry a lower index: they are covector components. The work along a path $\gamma$ is the line integral $W = \int_\gamma \tens{F}$.

- **Conservative**: $\tens{F} = -dV$, an [exact](note:closed-and-exact-forms) form. Work is path-independent: $W = V(\text{start}) - V(\text{end})$. Gravity and electrostatics are conservative and central.
- **Closed but not exact**: on the punctured plane, $\tens{F} = k\,(-y\, dx + x\, dy)/(x^2 + y^2)$ satisfies $d\tens{F} = 0$ but does work $2\pi k$ on every circuit of the origin ([chapter 6](../06-differential-forms/03-closed-and-exact.md)). Locally it has a potential; globally it doesn't.
- **Dissipative** forces such as friction depend on velocity as well as position, so they are not 1-forms on $Q$ alone.

## Conservation laws

The **kinetic energy** is $T = \tfrac12 \sum_A m_A\, \lvert \dot{\tens{r}}_A \rvert^2$. It is a quadratic form in the velocities, $T = \tfrac12\, g_{ij}\, \dot q^i \dot q^j$, with $g_{ij}$ the mass-weighted Euclidean metric. [Chapter 10](natural-systems-index.md) builds on that observation.

- **Energy.** If $\tens{F} = -dV$ with $V$ time-independent, $E = T + V$ is conserved:
$$\dot E = \sum_A \Bigl( m_A \ddot{\tens{r}}_A + \frac{\partial V}{\partial \tens{r}_A} \Bigr) \cdot \dot{\tens{r}}_A = 0.$$
A time-dependent $V$ gives $\dot E = \partial V / \partial t$ instead.
- **Linear momentum.** $\tens{P} = \sum_A \tens{p}_A$ obeys $\dot{\tens{P}} = \sum_A \tens{F}_A^{\mathrm{ext}}$; internal forces cancel by N3. It is conserved when there are no external forces.
- **Angular momentum.** $\tens{L} = \sum_A \tens{r}_A \times \tens{p}_A$ obeys $\dot{\tens{L}} = \sum_A \tens{r}_A \times \tens{F}_A^{\mathrm{ext}}$; internal torques cancel by strong N3. It is conserved when the external forces are central or absent.

Each is the charge of a continuous symmetry (time translation, spatial translation, rotation), as [chapter 12](../12-symmetry-and-noether/index.md) shows.

## Constraints

A [holonomic constraint](note:holonomic-constraint) $f(q, t) = 0$ confines the motion to a submanifold of $Q$. A rigid rod, a bead on a wire and a particle on a sphere are examples. A *nonholonomic* constraint restricts velocities without reducing the dimension of $Q$; a disk rolling without slipping is the standard case. The Lagrangian formalism works on the constraint submanifold directly ([page 3](05-constraints-and-examples.md)).
