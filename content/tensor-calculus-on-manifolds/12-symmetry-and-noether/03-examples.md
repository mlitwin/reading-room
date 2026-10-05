---
title: Examples
---

The classical conservation laws are the Noether charges of the symmetries of space and time. Translations and rotations are Killing fields of the flat kinetic metric ([previous page](02-symmetry-and-the-sphere.md)); time translation and the Galilean boost are not flows on $Q$ and use the general theorem. Throughout, $L = \tfrac12 \sum_A m_A\, \lvert \dot{\tens{r}}_A \rvert^2 - V$ on $Q = \mathbb{R}^{3N}$.

**Time translation → energy.** If $\partial L / \partial t = 0$, then $E = H = T + V$ is conserved ([page 1](01-noethers-theorem.md)).

**Spatial translation → linear momentum.** Suppose $V$ depends only on relative positions. Then translating every particle by the same constant vector $\tens{c}$, with generator $\tens{\xi}_A = \tens{c}$, is a symmetry. Its charge is
$$J_\xi = \sum_A \tens{p}_A \cdot \tens{c} = \tens{P} \cdot \tens{c}.$$
Since this holds for every direction $\tens{c}$, the total momentum $\tens{P}$ is conserved.

**Rotation → angular momentum.** Suppose $V$ is rotation-invariant. Rotation about a unit axis $\hat{\tens{n}}$ has generator $\tens{\xi}_A = \hat{\tens{n}} \times \tens{r}_A$, with charge
$$J_\xi = \sum_A \tens{p}_A \cdot (\hat{\tens{n}} \times \tens{r}_A) = \hat{\tens{n}} \cdot \sum_A \tens{r}_A \times \tens{p}_A = \hat{\tens{n}} \cdot \tens{L}.$$
Invariance about every axis conserves every component of $\tens{L}$. Restricted to a single particle on a sphere, the three rotation generators are the round sphere's three [Killing fields](note:killing-vector) ([chapter 8](../08-connection-and-curvature/03-killing-vectors.md)).

**Galilean boost → uniform motion of the center of mass.** Suppose $V$ depends only on relative positions. Under $\tens{r}_A \mapsto \tens{r}_A + \epsilon\, t\, \hat{\tens{v}}$ (generator $t\, \hat{\tens{v}}$, explicitly time-dependent), the Lagrangian changes by a total derivative:
$$\delta L = \sum_A m_A\, \dot{\tens{r}}_A \cdot \hat{\tens{v}} = \frac{d}{dt}\Bigl( \sum_A m_A\, \tens{r}_A \cdot \hat{\tens{v}} \Bigr).$$
It is a quasi-symmetry with $F = \sum_A m_A\, \tens{r}_A \cdot \hat{\tens{v}}$. Its charge is $J = \hat{\tens{v}} \cdot (t\,\tens{P} - M \tens{R}_{\mathrm{cm}})$, with $M = \sum_A m_A$ and $\tens{R}_{\mathrm{cm}}$ the center of mass. Conservation in every direction says $M\tens{R}_{\mathrm{cm}} - \tens{P}\, t$ is constant: the center of mass moves in a straight line at constant velocity.

**Hidden symmetries.** Less obvious symmetries give less obvious charges. The Laplace–Runge–Lenz vector of the Kepler problem comes from a symmetry of the $1/r$ potential that mixes positions and velocities: the hidden $SO(4)$ of bound orbits. Its conservation is what makes Kepler orbits close. The relativistic correction in [Schwarzschild](../15-general-relativity/02-schwarzschild.md) breaks it, and the orbit precesses.
