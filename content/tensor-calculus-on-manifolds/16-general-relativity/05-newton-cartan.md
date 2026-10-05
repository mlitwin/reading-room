---
title: Newton–Cartan gravity
---

The [Newtonian limit](04-newtonian-limit.md) recovers Newton's gravity from general relativity approximately. Cartan (1923) showed that Newton's theory can be stated *exactly* in the same geometric language. Gravity becomes the curvature of a spacetime connection, free fall becomes geodesic motion, and Poisson's equation becomes a curvature equation. What Newtonian spacetime lacks is a spacetime metric. Units are $G = 1$.

## Galilean structure

Newtonian spacetime $M \cong \mathbb{R}^4$ carries two degenerate structures in place of a Lorentzian metric:

- an **absolute time** 1-form $\tens{\tau} = dt$, closed, whose level sets are the instants of simultaneity;
- a **spatial metric** $h^{\mu\nu}$, a symmetric $(2, 0)$-tensor of rank 3 that measures lengths within each instant, with $h^{\mu\nu}\tau_\nu = 0$.

In Galilean coordinates $(t, x^i)$, $\tau_\mu = (1, 0, 0, 0)$ and $h^{\mu\nu} = \mathrm{diag}(0, 1, 1, 1)$. Neither tensor is invertible. There are no musical isomorphisms here, and there is no Levi-Civita theorem: compatibility with $\tens{\tau}$ and $h$ does not determine a connection.

## The gravitational connection

Choose the [connection](note:affine-connection) whose only non-zero coefficients in Galilean coordinates are
$$\Gamma^i{}_{00} = \partial_i \Phi,$$
with $\Phi$ the Newtonian potential. It is torsion-free, and it is compatible with both structures, $\nabla\tens{\tau} = 0$ and $\nabla h = 0$, since every $\Gamma$ with an upper $0$ or a lower spatial index vanishes. Its geodesics, $\ddot x^\mu + \Gamma^\mu{}_{\nu\lambda}\dot x^\nu \dot x^\lambda = 0$, have $\ddot t = 0$, so $t$ is an affine parameter, and
$$\frac{d^2 x^i}{dt^2} = -\partial_i \Phi.$$
Free fall is geodesic motion, and all bodies fall alike because no mass appears (the equivalence principle). Gravity is no longer a force: it is the inhomogeneous, coordinate-dependent part of the connection. A freely falling frame, where $\partial_i\Phi = 0$ at a point, makes it vanish there.

## Curvature and the field equation

The non-zero components of the [Riemann tensor](note:riemann-tensor), up to antisymmetry in the last pair, are
$$R^i{}_{0j0} = \partial_j \Gamma^i{}_{00} = \partial_i \partial_j \Phi,$$
the Newtonian tidal tensor, as in [geodesic deviation](../12-connection-and-curvature/04-geodesic-deviation.md). Its trace is the Ricci component $R_{00} = \nabla^2 \Phi$, so Poisson's equation becomes a geometric field equation:
$$\boxed{\quad R_{\mu\nu} = 4\pi\rho\, \tau_\mu \tau_\nu. \quad}$$
Compare the trace-reversed [Einstein equations](note:einstein-equations) for slow matter, where $R_{00} \approx 4\pi\rho$ is the only significant component. Newton–Cartan theory is the $c \to \infty$ limit of general relativity taken *exactly*. In that limit the Lorentzian metric degenerates: $g_{\mu\nu}/c^2 \to -\tau_\mu\tau_\nu$, and $g^{\mu\nu} \to h^{\mu\nu}$.

## What it clarifies

- **Gravity is curvature even without relativity.** The geometric picture, in which free fall is geodesic motion and tides are curvature, does not depend on the speed of light. What relativity changes is the structure the connection must respect: a Lorentzian metric instead of a Galilean pair.
- **The potential is frame-dependent; the connection is not.** Passing to Galilean coordinates that accelerate with $\tens{a}(t)$ shifts $\Phi \to \Phi + \tens{a}(t) \cdot \tens{x}$ but describes the same connection. Only $\partial_i\partial_j\Phi$, the curvature, is frame-independent. A uniform gravitational field can be transformed away, as the equivalence principle says.
- **Two geometrizations of $\Phi$.** The [Jacobi metric](../13-natural-systems/02-covariant-newton.md) absorbs the potential into a *spatial* metric at fixed energy. Newton–Cartan absorbs it into a *spacetime* connection for all energies at once. Only the second extends to general relativity.
