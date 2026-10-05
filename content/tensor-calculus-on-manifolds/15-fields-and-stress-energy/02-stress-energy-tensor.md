---
title: The stress–energy tensor
---

## Definition by metric variation

The **stress–energy tensor** of a matter action $S_{\mathrm{matter}} = \int \mathcal{L}\, \mathrm{vol}_g$ is its response to a change of metric:
$$T_{\mu\nu} := -\frac{2}{\sqrt{\lvert \det g \rvert}}\, \frac{\delta\bigl(\sqrt{\lvert \det g \rvert}\, \mathcal{L}\bigr)}{\delta g^{\mu\nu}} = -2\, \frac{\partial \mathcal{L}}{\partial g^{\mu\nu}} + g_{\mu\nu}\, \mathcal{L}.$$
The second form holds when $\mathcal{L}$ contains no derivatives of the metric; it uses $\delta\sqrt{\lvert \det g \rvert} = -\tfrac12 \sqrt{\lvert \det g \rvert}\, g_{\mu\nu}\, \delta g^{\mu\nu}$. $T_{\mu\nu}$ is symmetric because $g^{\mu\nu}$ is. Its components in an orthonormal frame are the energy density $T_{00}$, the momentum density $T_{0i}$, and the stresses $T_{ij}$.

- **Scalar field.** $T_{\mu\nu} = \nabla_\mu\phi\, \nabla_\nu\phi - \tfrac12\, g_{\mu\nu}\, (\nabla\phi)^2 - g_{\mu\nu}\, V(\phi)$. The energy density is $T_{00} = \tfrac12\dot\phi^2 + \tfrac12 \lvert \nabla\phi \rvert^2 + V \geq 0$ in flat space when $V \ge 0$.
- **Electromagnetism.** $T_{\mu\nu} = \tfrac{1}{4\pi}\bigl(F_{\mu\lambda}\, F_\nu{}^\lambda - \tfrac14\, g_{\mu\nu}\, F_{\rho\sigma} F^{\rho\sigma}\bigr)$, with $T_{00} = (E^2 + B^2)/8\pi$.
- **Perfect fluid.** $T_{\mu\nu} = (\rho + p)\, u_\mu u_\nu + p\, g_{\mu\nu}$, with energy density $\rho$, pressure $p$, and four-velocity $\tens{u}$. **Dust** is the case $p = 0$.

In flat space, the scalar field's $T^\mu{}_\nu$ agrees with the canonical Noether current of spacetime translations, $-\frac{\partial\mathcal{L}}{\partial(\partial_\mu\phi)}\, \partial_\nu\phi + \delta^\mu_\nu\, \mathcal{L}$. For fields with spin the canonical tensor is not symmetric, and the metric definition is the correct one (the Belinfante improvement reconciles them).

## Conservation

Because $S_{\mathrm{matter}}$ is diffeomorphism-invariant, its variation under the flow of any vector field vanishes. When the matter field equations hold, this gives
$$\nabla_\mu T^{\mu\nu} = 0.$$
This is a *local* statement about a tensor. It does not by itself give conserved energy, because there is no global time translation to integrate against.

**Killing currents.** If $\tens{\xi}$ is a [Killing field](note:killing-vector), the current $J^\mu = T^{\mu\nu}\xi_\nu$ is conserved:
$$\nabla_\mu J^\mu = (\nabla_\mu T^{\mu\nu})\, \xi_\nu + T^{\mu\nu}\, \nabla_\mu \xi_\nu = 0 + 0,$$
because $T^{\mu\nu}$ is symmetric and $\nabla_\mu\xi_\nu$ antisymmetric. Its flux through a spacelike slice is a conserved charge, as on the [previous page](01-lagrangian-field-theory.md). This is the field version of the particle Killing charge $\xi_\mu \dot x^\mu$ ([chapter 11](../11-metric/03-killing-vectors.md)):

- in Minkowski space, the ten Killing fields give conserved energy, momentum, angular momentum and the boost charge;
- in a stationary spacetime, $\partial_t$ gives conserved energy;
- in a generic spacetime, there is none.

## Flat reduction: dust

For dust in Minkowski space, $T^{\mu\nu} = \rho\, u^\mu u^\nu$. Write $u^\mu = \gamma(1, \tens{v})$. Contracting $\partial_\mu T^{\mu\nu} = 0$ with $u_\nu$ gives the continuity equation $\partial_\mu(\rho u^\mu) = 0$. Its projection orthogonal to $\tens{u}$ gives $u^\mu \partial_\mu u^\nu = 0$: dust particles move on straight lines. For $v \ll 1$ these become
$$\partial_t \rho + \nabla \cdot (\rho\tens{v}) = 0, \qquad \partial_t \tens{v} + (\tens{v} \cdot \nabla)\tens{v} = 0,$$
the Newtonian continuity and pressureless Euler equations. In curved spacetime the same contraction gives geodesic motion: conservation of $T^{\mu\nu}$ implies the equations of motion of the matter.
