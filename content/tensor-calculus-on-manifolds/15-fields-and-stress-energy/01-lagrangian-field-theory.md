---
title: Lagrangian field theory
---

## Action and field equations

A field is a tensor field $\phi$ on spacetime $(M, \tens{g})$. Here $\phi$ is a scalar unless stated otherwise. Its dynamics are fixed by a scalar **Lagrangian density** $\mathcal{L}(\phi, \nabla\phi; \tens{g})$ and the action
$$S[\phi] = \int_M \mathcal{L}\; \mathrm{vol}_g = \int \mathcal{L}\, \sqrt{\lvert \det g \rvert}\; d^4x,$$
where $\mathrm{vol}_g$ is the metric [volume form](note:volume-form). The mechanical dictionary:

| Particle mechanics | Field theory |
|---|---|
| time $t$ | spacetime point $x^\mu$ |
| coordinates $q^i(t)$ | field values $\phi(x)$ |
| velocities $\dot q^i$ | derivatives $\nabla_\mu \phi$ |
| $L(q, \dot q)$, $S = \int L\, dt$ | $\mathcal{L}(\phi, \nabla\phi)$, $S = \int \mathcal{L}\, \mathrm{vol}_g$ |

Varying $\phi \mapsto \phi + \delta\phi$ with $\delta\phi$ compactly supported, and integrating by parts by the divergence form of [Stokes's theorem](note:stokess-theorem), gives the **field Euler–Lagrange equations**
$$\boxed{\quad \nabla_\mu\, \frac{\partial \mathcal{L}}{\partial(\nabla_\mu \phi)} - \frac{\partial \mathcal{L}}{\partial \phi} = 0. \quad}$$
In Minkowski space with inertial coordinates, $\nabla_\mu$ is $\partial_\mu$ and $\mathrm{vol}_g$ is $d^4x$ ([flat reduction](../14-special-relativity/01-minkowski-spacetime.md)).

## Two examples

**Scalar field.** $\mathcal{L} = -\tfrac12\, g^{\mu\nu}\, \nabla_\mu\phi\, \nabla_\nu\phi - V(\phi)$ gives
$$\Box\phi := \nabla^\mu \nabla_\mu \phi = V'(\phi).$$
For $V = \tfrac12 m^2 \phi^2$ this is the Klein–Gordon equation, which in flat space reads $-\partial_t^2\phi + \nabla^2\phi = m^2\phi$.

**Electromagnetism.** The field is the potential 1-form $\tens{A}$, with $\tens{F} = d\tens{A}$. In Gaussian units, with a source current $J^\mu$,
$$\mathcal{L} = -\frac{1}{16\pi}\, F_{\mu\nu} F^{\mu\nu} + A_\mu J^\mu.$$
Varying $A_\mu$ gives $\nabla_\mu F^{\nu\mu} = 4\pi J^\nu$. The other half of Maxwell's equations, $d\tens{F} = 0$, holds identically because $d^2 = 0$. In flat space the time component is $\nabla \cdot \tens{E} = 4\pi\rho$, which fixes the sign.

## Noether currents

Suppose a continuous transformation $\phi \mapsto \phi + \epsilon\, \delta\phi$ changes $\mathcal{L}$ by at most a divergence, $\delta\mathcal{L} = \nabla_\mu K^\mu$. Then the current
$$J^\mu = \frac{\partial \mathcal{L}}{\partial(\nabla_\mu \phi)}\, \delta\phi - K^\mu$$
is conserved on solutions: $\nabla_\mu J^\mu = 0$. The proof is the field version of [chapter 8](../08-symmetry-and-noether/01-noethers-theorem.md)'s. A conserved current gives a conserved **charge**. Integrate $\nabla_\mu J^\mu = 0$ over the region between two spacelike slices $\Sigma_1$, $\Sigma_2$ and apply Stokes's theorem: the flux $\int_\Sigma J^\mu\, d\Sigma_\mu$ is the same through both slices, provided $J^\mu$ falls off at spatial infinity. Electric charge is the charge of the phase symmetry of a complex field. Energy and momentum are the charges of spacetime translations, which the [next page](02-stress-energy-tensor.md) handles through the stress–energy tensor.
