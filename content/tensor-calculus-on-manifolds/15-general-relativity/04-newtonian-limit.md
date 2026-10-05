---
title: The Newtonian limit
---

General relativity must reproduce Newtonian gravity for weak fields and slow matter. The limit identifies the Newtonian potential $\Phi$ inside the metric. It turns the geodesic equation into $\ddot{\tens{x}} = -\nabla\Phi$ and the Einstein equations into Poisson's equation. Units are $G = c = 1$.

## Assumptions

- **Weak field:** in suitable coordinates $g_{\mu\nu} = \eta_{\mu\nu} + h_{\mu\nu}$ with $\lvert h_{\mu\nu} \rvert \ll 1$. Keep terms linear in $h$.
- **Static field:** $\partial_t h_{\mu\nu} = 0$.
- **Slow motion:** particle velocities $v \ll 1$. Matter has $T_{00} = \rho \gg \lvert T_{ij} \rvert$, so pressure is negligible next to energy density.

## Geodesics: $g_{00} \approx -(1 + 2\Phi)$

For $v \ll 1$ the four-velocity is $u^\mu \approx (1, \tens{0})$, and proper time is coordinate time. The [geodesic equation](note:geodesic) keeps only the $u^0 u^0$ term:
$$\frac{d^2 x^i}{dt^2} \approx -\Gamma^i{}_{00} = \tfrac12\, \partial_i h_{00},$$
using $\Gamma^i{}_{00} = \tfrac12\, g^{ii}\,(2\partial_0 g_{0i} - \partial_i g_{00}) = -\tfrac12\, \partial_i h_{00}$ for a static field. Comparison with $\ddot{\tens{x}} = -\nabla\Phi$ gives
$$h_{00} = -2\Phi, \qquad g_{00} \approx -(1 + 2\Phi).$$
The Newtonian potential is a perturbation of the time-time component of the metric. Gravity acts through clock rates: for a static clock, $d\tau = \sqrt{-g_{00}}\, dt \approx (1 + \Phi)\, dt$, the gravitational redshift of [Schwarzschild](02-schwarzschild.md). In the language of [chapter 10](../10-lagrangian-mechanics/natural-systems-index.md), the potential $V = m\Phi$ has been absorbed into the geometry.

## Field equations: Poisson's equation

Write the Einstein equations (with $\Lambda = 0$) in trace-reversed form, $R_{\mu\nu} = 8\pi\bigl(T_{\mu\nu} - \tfrac12\, T\, g_{\mu\nu}\bigr)$. For slow matter, $T_{00} = \rho$ and $T = g^{\mu\nu}T_{\mu\nu} \approx -\rho$, so
$$R_{00} \approx 8\pi\bigl(\rho - \tfrac12\rho\bigr) = 4\pi\rho.$$
To linear order in a static field, $R_{00} \approx \partial_i \Gamma^i{}_{00} = \nabla^2 \Phi$. Therefore
$$\boxed{\quad \nabla^2 \Phi = 4\pi\rho \quad}$$
which is Poisson's equation, with $G$ restored as $4\pi G\rho$. The factor $8\pi$ in the [Einstein equations](note:einstein-equations) is fixed by exactly this match.

## Tides

With the same approximations, $R^i{}_{0j0} \approx \partial_j \Gamma^i{}_{00} = \partial_i \partial_j \Phi$. The [geodesic-deviation equation](../08-connection-and-curvature/05-geodesic-deviation.md) $\nabla_{\tens{u}}\nabla_{\tens{u}}\tens{S} = \tens{R}(\tens{u}, \tens{S})\tens{u}$ becomes
$$\frac{d^2 S^i}{dt^2} = -\,\partial_i \partial_j \Phi\; S^j,$$
the Newtonian tidal acceleration between neighbouring particles. Poisson's equation is the trace of this tidal tensor. In this sense the Einstein equations are "tidal trace = $4\pi\rho$", promoted to all directions of spacetime.

## Validity

The limit needs $\lvert\Phi\rvert \ll 1$ (about $10^{-9}$ at the Earth's surface and $10^{-6}$ at the Sun's) and $v \ll 1$. Corrections at the next order, the post-Newtonian terms, give the [classical tests](02-schwarzschild.md): perihelion precession, light deflection (twice the Newtonian value, because $g_{ij}$ is perturbed as well as $g_{00}$), and Shapiro delay. The [next page](05-newton-cartan.md) recasts the limit itself exactly, as Newton–Cartan geometry.
